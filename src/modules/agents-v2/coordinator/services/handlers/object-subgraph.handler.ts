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
      add_field: `Add field: ${originalMessage}`,
      update_object: `Update object: ${originalMessage}`,
      delete_object: `Delete object: ${originalMessage}`,
      create_field: `Create field: ${originalMessage}`,
      update_field: `Update field: ${originalMessage}`,
      delete_field: `Delete field: ${originalMessage}`,
    };

    return intentMap[intent.intent] || originalMessage;
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

    if (!subgraphOutput.isCompleted) {
      errors.push('Object processing not completed');
    }

    if (subgraphOutput.isCompleted && !subgraphOutput.executionResult && !subgraphOutput.error) {
      errors.push('Completed object processing should have execution result or error');
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
      messages: [],
      originalMessage: subgraphMessage,
      chatSessionId: state.chatSessionId,
      fieldSpec: null,
      objectSpec: null,
      dbDesignResult: null,
      typeMappingResult: null,
      enrichedSpec: null,
      executionResult: null,
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

    // Determine completion status
    const isObjectCompleted = subgraphOutput.executionResult?.status === 'success';
    const hasPartialSuccess = subgraphOutput.executionResult?.status === 'partial';

    return {
      messages: [...coordinatorState.messages, ...(subgraphOutput.messages || [])],
      isCompleted: isObjectCompleted || hasPartialSuccess,
      processedIntents,
      currentIntentIndex: nextIntentIndex,
      error: subgraphOutput.error,
    };
  }
}
