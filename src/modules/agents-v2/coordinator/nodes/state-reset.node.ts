import { Injectable } from '@nestjs/common';

import { GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorStateType, RESET_MARKER } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class StateResetNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    try {
      this.logger.debug('StateResetNode: Checking if state reset is needed');

      // Check if this is a new user prompt by detecting if we already have a completed workflow
      // If isCompleted is true and we have a new originalMessage, this is a new user prompt
      const isNewUserPrompt = state.isCompleted && state.originalMessage;

      if (isNewUserPrompt) {
        this.logger.log('Detected new user prompt in existing session, resetting per-prompt state');
        this.logger.debug(
          `Before reset - classifiedIntent: ${!!state.classifiedIntent}, currentIntentIndex: ${state.currentIntentIndex}, processedIntents: [${state.processedIntents?.join(', ')}], errors: ${state.errors?.length}, isCompleted: ${state.isCompleted}`,
        );

        // Reset per-prompt state using proper patterns for LangGraph reducers
        const resetState: Partial<CoordinatorStateType> = {
          // Session-level data is preserved automatically by not updating it

          // Reset per-prompt state - use specific reset symbols for fields that need explicit reset
          classifiedIntent: RESET_MARKER as never, // This will trigger reset in reducer
          currentIntentIndex: RESET_MARKER as never, // This will trigger reset in reducer
          processedIntents: [RESET_MARKER as never], // This will trigger reset in reducer
          errors: [RESET_MARKER as never], // This will trigger reset in reducer
          currentNode: GRAPH_NODES.STATE_RESET, // This will overwrite (no reset symbol needed)
          retryCount: RESET_MARKER as never, // This will trigger reset in reducer
          isCompleted: RESET_MARKER as never, // This will trigger reset in reducer
        };

        this.logger.debug(
          `After reset - classifiedIntent: null, currentIntentIndex: 0, processedIntents: [], errors: [], isCompleted: false`,
        );
        this.logger.log(
          `Preserved session data - messages: ${state.messages?.length}, applicationResults: ${state.applicationResults?.length}, objectResults: ${state.objectResults?.length}`,
        );

        return this.createSuccessResult(resetState);
      }

      // No reset needed, continue with existing state
      this.logger.debug('No state reset needed, continuing with existing state');
      return this.createSuccessResult({});
    } catch (error) {
      return this.handleError(error, 'state reset');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.STATE_RESET;
  }
}
