import { Injectable } from '@nestjs/common';

import type {
  CoordinatorStateType,
  IntentError,
  ObjectIntentResult,
} from '@/modules/agents-v2/coordinator/types/graph-state.types';
import { CoordinatorStateHelper } from '@/modules/agents-v2/coordinator/types/graph-state.types';
import type {
  IntentDetails,
  SubgraphHandler,
  ValidationResult,
} from '@/modules/agents-v2/coordinator/types/subgraph-handler.types';
import type { ObjectStateType } from '@/modules/agents-v2/object/types/object-graph-state.types';

@Injectable()
export class ObjectSubgraphHandler implements SubgraphHandler<ObjectStateType> {
  validateContext(state: CoordinatorStateType): ValidationResult {
    const errors: string[] = [];

    if (!state.originalMessage) {
      errors.push('Original message is required for object domain');
    }

    if (!state.classifiedIntent) {
      errors.push('Classified intent is required for object domain');
    }

    if (typeof state.currentIntentIndex !== 'number' || state.currentIntentIndex < 0) {
      errors.push('Valid current intent index is required for object domain');
    }

    const currentIntent = state.classifiedIntent?.intents[state.currentIntentIndex];
    if (!currentIntent) {
      errors.push('Current intent is required for object domain');
    }

    if (currentIntent && currentIntent.domain !== 'object') {
      errors.push(`Expected object domain, got: ${currentIntent.domain}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  buildSubgraphMessage(intent: IntentDetails, originalMessage: string): string {
    // Build a focused message for the object subgraph based on intent
    const intentMap: Record<string, string> = {
      create_object: `Create object: ${originalMessage}`,
      manipulate_object_fields: `Manipulate object fields: ${originalMessage}`,
      update_object_metadata: `Update object metadata: ${originalMessage}`,
      design_data_schema: `Design data schema: ${originalMessage}`,
      delete_object: `Delete object: ${originalMessage}`,
    };

    const baseMessage = intentMap[intent.intent] || originalMessage;

    // Add details if available
    const intentDetails = intent.details ? ` Details: ${JSON.stringify(intent.details)}` : '';
    const targetInfo = intent.target
      ? ` Target: ${Array.isArray(intent.target) ? intent.target.join(', ') : intent.target}`
      : '';

    return `${baseMessage}${targetInfo}${intentDetails}`;
  }

  validateSubgraphResults(subgraphOutput: ObjectStateType): ValidationResult {
    const errors: string[] = [];

    if (!subgraphOutput) {
      errors.push('Object subgraph output is required');
      return { isValid: false, errors };
    }

    if (subgraphOutput.error) {
      errors.push(`Object processing error: ${subgraphOutput.error}`);
    }

    // Check if we have proper completion status
    if (!subgraphOutput.isCompleted && !subgraphOutput.error) {
      errors.push('Object processing should be completed or have an error');
    }

    // For successful completions, validate execution results
    if (subgraphOutput.isCompleted && !subgraphOutput.error) {
      if (!subgraphOutput.executionResult) {
        errors.push('Completed object processing should have execution result');
      } else if (subgraphOutput.executionResult.status === 'failed') {
        errors.push('Object execution marked as failed but no error provided');
      } else if (
        subgraphOutput.executionResult.status === 'success' &&
        !subgraphOutput.executionResult.objectId &&
        !subgraphOutput.executionResult.fieldIds
      ) {
        errors.push('Successful object execution should have objectId or fieldIds');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  transformToSubgraphState(state: CoordinatorStateType): Partial<ObjectStateType> {
    const currentIntent = state.classifiedIntent?.intents[state.currentIntentIndex];
    if (!currentIntent) {
      throw new Error('No current intent found for object subgraph transformation');
    }

    const subgraphMessage = this.buildSubgraphMessage(currentIntent, state.originalMessage);

    // Get the latest object result for potential context
    const latestObjectResult = CoordinatorStateHelper.getLatestObjectResult(state);

    return {
      messages: state.messages || [],
      originalMessage: subgraphMessage,
      chatSessionId: state.chatSessionId,
      intent: currentIntent,
      // Inherit any existing object state from previous executions
      fieldSpec: latestObjectResult?.fieldSpec || null,
      objectSpec: latestObjectResult?.objectSpec || null,
      dbDesignResult: latestObjectResult?.dbDesignResult || null,
      typeMappingResult: latestObjectResult?.typeMappingResult || null,
      executionResult: latestObjectResult?.executionResult || null,
      currentNode: 'start',
      retryCount: 0,
      isCompleted: false,
    };
  }

  transformToCoordinatorState(
    subgraphOutput: ObjectStateType,
    coordinatorState: CoordinatorStateType,
  ): Partial<CoordinatorStateType> {
    // Always update processed intents and move to next intent
    const processedIntents = [
      ...coordinatorState.processedIntents,
      coordinatorState.currentIntentIndex,
    ];
    const nextIntentIndex = coordinatorState.currentIntentIndex + 1;

    // Determine completion status based on execution result
    const isObjectCompleted = subgraphOutput.executionResult?.status === 'success';
    const hasPartialSuccess = subgraphOutput.executionResult?.status === 'partial';
    const hasFailed = subgraphOutput.error || subgraphOutput.executionResult?.status === 'failed';

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
        errorMessage: subgraphOutput.error || 'Object execution failed',
        timestamp: new Date().toISOString(),
        retryCount,
      });
    }

    // Create object result for this intent
    const objectResult: ObjectIntentResult = {
      intentId: `intent_${coordinatorState.currentIntentIndex}`,
      intentIndex: coordinatorState.currentIntentIndex,
      timestamp: new Date().toISOString(),
      domain: 'object',
      status: isObjectCompleted
        ? 'success'
        : hasPartialSuccess
          ? 'partial'
          : hasFailed
            ? 'failed'
            : 'failed',
      result: {
        fieldSpec: subgraphOutput.fieldSpec,
        objectSpec: subgraphOutput.objectSpec,
        dbDesignResult: subgraphOutput.dbDesignResult,
        typeMappingResult: subgraphOutput.typeMappingResult,
        executionResult: subgraphOutput.executionResult,
      },
    };

    // Always return the state update with incremented intent index
    const coordinatorUpdate: Partial<CoordinatorStateType> = {
      messages: [...coordinatorState.messages, ...(subgraphOutput.messages || [])],
      isCompleted: isObjectCompleted || hasPartialSuccess,
      processedIntents,
      currentIntentIndex: nextIntentIndex,
      errors: [...coordinatorState.errors, ...newIntentErrors],
      objectResults: [objectResult],
    };

    // Note: We always increment the intent index, even on failure
    // This prevents infinite loops and allows processing of remaining intents
    return coordinatorUpdate;
  }

  formatResponseMessage(subgraphOutput: ObjectStateType): string {
    const message = subgraphOutput.originalMessage || '';
    const executionResult = subgraphOutput.executionResult;

    if (executionResult) {
      const status = executionResult.status === 'success' ? 'succeeded' : 'failed';
      const resultMessage =
        executionResult.status === 'success'
          ? 'succeeded'
          : `failed with error: ${executionResult.errors?.join(', ')}`;
      return `${message} - Execution ${status}: ${resultMessage}`;
    }

    return message;
  }

  transformToResponse(
    subgraphOutput: ObjectStateType,
    request: {
      chatSessionId: string;
      intent: IntentDetails;
      objectSpec?: ObjectStateType['objectSpec'];
    },
    state: CoordinatorStateType,
  ): {
    chatSessionId: string;
    subgraphType: string;
    success: boolean;
    result: {
      message: string;
      objectSpec: ObjectStateType['objectSpec'];
      executionResult: ObjectStateType['executionResult'];
    };
    state: Partial<CoordinatorStateType>;
    error: string | null;
  } {
    return {
      chatSessionId: subgraphOutput.chatSessionId || request.chatSessionId,
      subgraphType: 'object',
      success: !subgraphOutput.error && subgraphOutput.isCompleted,
      result: {
        message: this.formatResponseMessage(subgraphOutput),
        objectSpec: subgraphOutput.objectSpec,
        executionResult: subgraphOutput.executionResult,
      },
      state: {
        ...state,
        messages: subgraphOutput.messages || [],
        objectResults: [
          {
            intentId: 'unknown',
            intentIndex: 0, // This should be passed from the actual context
            timestamp: new Date().toISOString(),
            domain: 'object',
            status: subgraphOutput.isCompleted && !subgraphOutput.error ? 'success' : 'failed',
            result: {
              fieldSpec: subgraphOutput.fieldSpec,
              objectSpec: subgraphOutput.objectSpec,
              dbDesignResult: subgraphOutput.dbDesignResult,
              typeMappingResult: subgraphOutput.typeMappingResult,
              executionResult: subgraphOutput.executionResult,
            },
          },
        ],
      },
      error: subgraphOutput.error || null,
    };
  }
}
