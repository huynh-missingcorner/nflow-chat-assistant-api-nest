import { Injectable } from '@nestjs/common';

import type { CoordinatorStateType } from '@/modules/agents-v2/coordinator/types/graph-state.types';
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

    if (!state.currentIntentIndex) {
      // Default to 0 if not provided
      state.currentIntentIndex = 0;
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

    return {
      messages: state.messages || [],
      originalMessage: subgraphMessage,
      chatSessionId: state.chatSessionId,
      intent: currentIntent,
      // Inherit any existing object state from coordinator
      fieldSpec: state.fieldSpec || null,
      objectSpec: state.objectSpec || null,
      dbDesignResult: state.dbDesignResult || null,
      typeMappingResult: state.typeMappingResult || null,
      executionResult: state.objectExecutionResult || null,
      error: null,
      currentNode: 'start',
      retryCount: 0,
      isCompleted: false,
    };
  }

  transformToCoordinatorState(
    subgraphOutput: ObjectStateType,
    coordinatorState: CoordinatorStateType,
  ): Partial<CoordinatorStateType> {
    // Update processed intents and move to next
    const processedIntents = [
      ...coordinatorState.processedIntents,
      coordinatorState.currentIntentIndex,
    ];
    const nextIntentIndex = coordinatorState.currentIntentIndex + 1;

    // Determine completion status based on execution result
    const isObjectCompleted = subgraphOutput.executionResult?.status === 'success';
    const hasPartialSuccess = subgraphOutput.executionResult?.status === 'partial';
    const hasFailed = subgraphOutput.error || subgraphOutput.executionResult?.status === 'failed';

    // Prepare the coordinator state update
    const coordinatorUpdate: Partial<CoordinatorStateType> = {
      messages: [...coordinatorState.messages, ...(subgraphOutput.messages || [])],
      isCompleted: isObjectCompleted || hasPartialSuccess,
      processedIntents,
      currentIntentIndex: nextIntentIndex,
      error: subgraphOutput.error,

      // Copy object state back to coordinator for potential future use
      fieldSpec: subgraphOutput.fieldSpec,
      objectSpec: subgraphOutput.objectSpec,
      dbDesignResult: subgraphOutput.dbDesignResult,
      typeMappingResult: subgraphOutput.typeMappingResult,
      objectExecutionResult: subgraphOutput.executionResult,
    };

    // If there was a failure, don't mark as completed
    if (hasFailed) {
      coordinatorUpdate.isCompleted = false;
    }

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
        fieldSpec: subgraphOutput.fieldSpec,
        objectSpec: subgraphOutput.objectSpec,
      },
      error: subgraphOutput.error || null,
    };
  }
}
