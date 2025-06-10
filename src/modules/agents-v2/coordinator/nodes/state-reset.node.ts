import { Injectable } from '@nestjs/common';

import { GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorStateType, RESET_MARKER } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class StateResetNode extends GraphNodeBase {
  execute(): Partial<CoordinatorStateType> {
    try {
      const resetState: Partial<CoordinatorStateType> = {
        classifiedIntent: RESET_MARKER as never,
        currentIntentIndex: RESET_MARKER as never,
        processedIntents: [RESET_MARKER as never],
        errors: [RESET_MARKER as never],
        currentNode: GRAPH_NODES.STATE_RESET,
        retryCount: RESET_MARKER as never,
        isCompleted: RESET_MARKER as never,
      };

      return this.createSuccessResult(resetState);
    } catch (error) {
      return this.handleError(error, 'state reset');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.STATE_RESET;
  }
}
