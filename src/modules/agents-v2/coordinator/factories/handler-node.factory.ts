import { Injectable } from '@nestjs/common';

import { BaseGraphHandlerService, GenericHandlerNodeFactory, GraphConstants } from '@/shared/graph';

import { GRAPH_CONFIG, GRAPH_NODES, LOG_MESSAGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';

@Injectable()
export class CoordinatorHandlerNodeFactory extends GenericHandlerNodeFactory<CoordinatorStateType> {
  constructor(handlerService: BaseGraphHandlerService<CoordinatorStateType>) {
    super(handlerService);
  }

  protected getGraphConstants(): GraphConstants {
    return {
      nodes: {
        HANDLE_SUCCESS: GRAPH_NODES.HANDLE_SUCCESS,
        HANDLE_ERROR: GRAPH_NODES.HANDLE_ERROR,
        HANDLE_RETRY: GRAPH_NODES.HANDLE_RETRY,
      },
      config: {
        MAX_RETRY_COUNT: GRAPH_CONFIG.MAX_RETRY_COUNT,
      },
      logMessages: {
        workflowCompleted: LOG_MESSAGES.WORKFLOW_COMPLETED,
        workflowFailed: LOG_MESSAGES.WORKFLOW_FAILED,
        retryAttempt: LOG_MESSAGES.RETRYING_CLASSIFICATION,
      },
    };
  }
}
