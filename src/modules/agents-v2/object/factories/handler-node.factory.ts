import { Injectable } from '@nestjs/common';

import { BaseGraphHandlerService, GenericHandlerNodeFactory, GraphConstants } from '@/shared/graph';

import {
  OBJECT_GRAPH_CONFIG,
  OBJECT_GRAPH_NODES,
  OBJECT_LOG_MESSAGES,
} from '../constants/object-graph.constants';
import { ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class ObjectHandlerNodeFactory extends GenericHandlerNodeFactory<ObjectStateType> {
  constructor(handlerService: BaseGraphHandlerService<ObjectStateType>) {
    super(handlerService);
  }

  protected getGraphConstants(): GraphConstants {
    return {
      nodes: {
        HANDLE_SUCCESS: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
        HANDLE_ERROR: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        HANDLE_RETRY: OBJECT_GRAPH_NODES.HANDLE_RETRY,
      },
      config: {
        MAX_RETRY_COUNT: OBJECT_GRAPH_CONFIG.MAX_RETRY_COUNT,
      },
      logMessages: {
        workflowCompleted: OBJECT_LOG_MESSAGES.WORKFLOW_COMPLETED,
        workflowFailed: OBJECT_LOG_MESSAGES.WORKFLOW_FAILED,
        retryAttempt: OBJECT_LOG_MESSAGES.RETRY_ATTEMPT,
      },
    };
  }

  protected getAdditionalSuccessData(): Partial<ObjectStateType> {
    return { isCompleted: true, error: null };
  }

  protected getAdditionalErrorData(): Partial<ObjectStateType> {
    return { isCompleted: true };
  }
}
