import { Injectable } from '@nestjs/common';

import { GRAPH_NODES, LOG_MESSAGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class HandleRetryNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    const newRetryCount = state.retryCount + 1;

    this.logger.warn(LOG_MESSAGES.RETRYING_CLASSIFICATION(newRetryCount));

    return this.createSuccessResult({
      retryCount: newRetryCount,
      error: null, // Clear previous error
    });
  }

  protected getNodeName(): string {
    return GRAPH_NODES.HANDLE_RETRY;
  }
}
