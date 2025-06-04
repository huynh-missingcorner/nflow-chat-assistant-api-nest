import { Injectable, Logger } from '@nestjs/common';
import { SystemMessage } from '@langchain/core/messages';

import {
  OBJECT_GRAPH_CONFIG,
  OBJECT_GRAPH_NODES,
  OBJECT_LOG_MESSAGES,
} from '../constants/object-graph.constants';
import { ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class HandleRetryNode {
  private readonly logger = new Logger(HandleRetryNode.name);

  execute(state: ObjectStateType): Partial<ObjectStateType> {
    const currentRetryCount = state.retryCount || 0;
    const newRetryCount = currentRetryCount + 1;

    this.logger.log(OBJECT_LOG_MESSAGES.RETRY_ATTEMPT(newRetryCount));

    if (newRetryCount >= OBJECT_GRAPH_CONFIG.MAX_RETRY_COUNT) {
      this.logger.error(
        `Max retry count reached (${OBJECT_GRAPH_CONFIG.MAX_RETRY_COUNT}), marking as failed`,
      );

      return {
        error: `Maximum retry attempts (${OBJECT_GRAPH_CONFIG.MAX_RETRY_COUNT}) exceeded`,
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        retryCount: newRetryCount,
        messages: [
          ...state.messages,
          new SystemMessage(`Max retry attempts exceeded, failing workflow`),
        ],
      };
    }

    // Reset error state for retry
    return {
      error: null,
      retryCount: newRetryCount,
      currentNode: OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING,
      messages: [
        ...state.messages,
        new SystemMessage(
          `Retrying object workflow (attempt ${newRetryCount}/${OBJECT_GRAPH_CONFIG.MAX_RETRY_COUNT})`,
        ),
      ],
    };
  }
}
