import { Injectable } from '@nestjs/common';

import { ApplicationStateType } from '@/modules/agents-v2/application/types/application-graph-state.types';
import {
  ApplicationIntentResult,
  CoordinatorStateHelper,
  CoordinatorStateType,
  IntentError,
} from '@/modules/agents-v2/coordinator/types/graph-state.types';
import {
  IntentDetails,
  SubgraphHandler,
  ValidationResult,
} from '@/modules/agents-v2/coordinator/types/subgraph-handler.types';

@Injectable()
export class ApplicationSubgraphHandler implements SubgraphHandler<ApplicationStateType> {
  /**
   * Validates that the state is properly prepared for application subgraph execution
   */
  validateContext(state: CoordinatorStateType): ValidationResult {
    const errors: string[] = [];

    if (!state.classifiedIntent || !state.classifiedIntent.intents.length) {
      errors.push('No intents to process');
    }

    // Check if currentIntentIndex is a valid number
    if (typeof state.currentIntentIndex !== 'number' || state.currentIntentIndex < 0) {
      errors.push('Valid current intent index is required');
    }

    if (
      state.classifiedIntent &&
      typeof state.currentIntentIndex === 'number' &&
      state.currentIntentIndex >= state.classifiedIntent.intents.length
    ) {
      errors.push('Invalid intent index');
    }

    const currentIntent = state.classifiedIntent?.intents[state.currentIntentIndex];
    if (currentIntent && currentIntent.domain !== 'application') {
      errors.push(`Invalid domain for application subgraph: ${currentIntent.domain}`);
    }

    if (!state.originalMessage?.trim()) {
      errors.push('Empty or invalid original message');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Builds a contextualized message for the application agent
   */
  buildSubgraphMessage(intent: IntentDetails, originalMessage: string): string {
    const intentDetails = intent.details ? ` Details: ${JSON.stringify(intent.details)}` : '';
    const targetInfo = intent.target
      ? ` Target: ${Array.isArray(intent.target) ? intent.target.join(', ') : intent.target}`
      : '';

    return `${intent.intent} request: ${originalMessage}${targetInfo}${intentDetails}`;
  }

  /**
   * Validates that the application subgraph produced valid results
   */
  validateSubgraphResults(applicationOutput: ApplicationStateType): ValidationResult {
    const errors: string[] = [];

    // Check if we have an execution result
    if (!applicationOutput.executionResult) {
      errors.push('No execution result from application subgraph');
    }

    // Check if the status is valid
    const validStatuses = ['success', 'partial', 'failed'];
    if (
      applicationOutput.executionResult &&
      !validStatuses.includes(applicationOutput.executionResult.status)
    ) {
      errors.push(`Invalid execution status: ${applicationOutput.executionResult.status}`);
    }

    // For successful or partial executions, validate required fields
    if (
      applicationOutput.executionResult &&
      (applicationOutput.executionResult.status === 'success' ||
        applicationOutput.executionResult.status === 'partial')
    ) {
      if (!applicationOutput.executionResult.appId) {
        errors.push('Missing appId for successful execution');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Transforms coordinator state to application subgraph state
   */
  transformToSubgraphState(state: CoordinatorStateType): Partial<ApplicationStateType> {
    const currentIntent = state.classifiedIntent!.intents[state.currentIntentIndex];
    const applicationMessage = this.buildSubgraphMessage(currentIntent, state.originalMessage);
    const operationType = this.mapIntentToOperationType(currentIntent.intent);

    // Get the latest application result for potential context (optional)
    const latestApplicationResult = CoordinatorStateHelper.getLatestApplicationResult(state);

    return {
      originalMessage: applicationMessage,
      chatSessionId: state.chatSessionId,
      messages: state.messages,
      operationType,
      // Start with clean state for this execution
      applicationSpec: latestApplicationResult?.applicationSpec || null,
      enrichedSpec: latestApplicationResult?.enrichedSpec || null,
      executionResult: null,
      isCompleted: false,
    };
  }

  /**
   * Maps intent string to ApplicationOperationType
   */
  private mapIntentToOperationType(intent: string): ApplicationStateType['operationType'] {
    switch (intent) {
      case 'create_application':
        return 'create_application';
      case 'update_application':
        return 'update_application';
      case 'delete_application':
        return 'delete_application';
      default:
        throw new Error(`Unsupported application intent: ${intent}`);
    }
  }

  /**
   * Transforms application subgraph output back to coordinator state
   */
  transformToCoordinatorState(
    applicationOutput: ApplicationStateType,
    coordinatorState: CoordinatorStateType,
  ): Partial<CoordinatorStateType> {
    // Always update processed intents and move to next intent
    const processedIntents = [
      ...coordinatorState.processedIntents,
      coordinatorState.currentIntentIndex,
    ];
    const nextIntentIndex = coordinatorState.currentIntentIndex + 1;

    // Determine completion status
    const isApplicationCompleted = applicationOutput.executionResult?.status === 'success';
    const hasPartialSuccess = applicationOutput.executionResult?.status === 'partial';
    const hasFailed =
      applicationOutput.error || applicationOutput.executionResult?.status === 'failed';

    // Create intent error if there was a failure
    const currentIntent =
      coordinatorState.classifiedIntent?.intents[coordinatorState.currentIntentIndex];
    const newIntentErrors: IntentError[] = [];

    if (hasFailed && currentIntent && currentIntent.id) {
      const existingErrorsForIntent = coordinatorState.errors.filter(
        (err) => err.intentId === currentIntent.id,
      );
      const retryCount = existingErrorsForIntent.length;

      newIntentErrors.push({
        intentId: currentIntent.id,
        errorMessage: applicationOutput.error || 'Application execution failed',
        timestamp: new Date().toISOString(),
        retryCount,
      });
    }

    // Create application result for this intent
    const applicationResult: ApplicationIntentResult = {
      intentId: currentIntent?.id || `intent_${coordinatorState.currentIntentIndex}`,
      intentIndex: coordinatorState.currentIntentIndex,
      timestamp: new Date().toISOString(),
      domain: 'application',
      status: isApplicationCompleted
        ? 'success'
        : hasPartialSuccess
          ? 'partial'
          : hasFailed
            ? 'failed'
            : 'failed',
      result: {
        applicationSpec: applicationOutput.applicationSpec,
        enrichedSpec: applicationOutput.enrichedSpec,
        executionResult: applicationOutput.executionResult,
      },
    };

    // Always return the state update with incremented intent index
    return {
      isCompleted: isApplicationCompleted || hasPartialSuccess,
      processedIntents,
      currentIntentIndex: nextIntentIndex,
      errors: [...coordinatorState.errors, ...newIntentErrors],
      applicationResults: [applicationResult],
    };
  }
}
