import { Injectable } from '@nestjs/common';

import {
  APPLICATION_GRAPH_CONFIG,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
} from '../constants/application-graph.constants';
import { ApplicationStateType } from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

@Injectable()
export class HandleRetryNode extends ApplicationGraphNodeBase {
  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.HANDLE_RETRY;
  }

  execute(state: ApplicationStateType): Partial<ApplicationStateType> {
    const newRetryCount = this.incrementRetryCount(state);

    this.logger.warn(APPLICATION_LOG_MESSAGES.RETRY_ATTEMPT(newRetryCount));

    if (this.isMaxRetryReached(newRetryCount, APPLICATION_GRAPH_CONFIG.MAX_RETRY_COUNT)) {
      return this.createSuccessResult({
        error: 'Maximum retry attempts exceeded',
        isCompleted: true,
        retryCount: newRetryCount,
      });
    }

    return this.createSuccessResult({
      retryCount: newRetryCount,
      error: null,
    });
  }
}
