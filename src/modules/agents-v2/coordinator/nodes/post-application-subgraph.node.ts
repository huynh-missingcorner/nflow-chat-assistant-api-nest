import { Injectable } from '@nestjs/common';

import { GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class PostApplicationSubgraphNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    try {
      this.logger.debug('Processing application subgraph results');

      // Mark the current intent as processed and move to the next one
      const processedIntents = [...state.processedIntents, state.currentIntentIndex];
      const nextIntentIndex = state.currentIntentIndex + 1;

      // Check if application was completed successfully
      const isApplicationCompleted = state.executionResult?.status === 'success';

      this.logger.debug(
        `Application subgraph completed. Status: ${state.executionResult?.status || 'unknown'}, ` +
          `Moving from intent ${state.currentIntentIndex} to ${nextIntentIndex}`,
      );

      return this.createSuccessResult({
        processedIntents,
        currentIntentIndex: nextIntentIndex,
        isCompleted: isApplicationCompleted,
      });
    } catch (error) {
      return this.handleError(error, 'processing application subgraph results');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.POST_APPLICATION_SUBGRAPH;
  }
}
