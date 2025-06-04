import { Injectable } from '@nestjs/common';

import { BaseGraphHandlerService, GenericHandlerNodeFactory, GraphConstants } from '@/shared/graph';

import {
  APPLICATION_GRAPH_CONFIG,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
} from '../constants/application-graph.constants';
import { ApplicationStateType } from '../types/application-graph-state.types';

@Injectable()
export class ApplicationHandlerNodeFactory extends GenericHandlerNodeFactory<ApplicationStateType> {
  constructor(handlerService: BaseGraphHandlerService<ApplicationStateType>) {
    super(handlerService);
  }

  protected getGraphConstants(): GraphConstants {
    return {
      nodes: {
        HANDLE_SUCCESS: APPLICATION_GRAPH_NODES.HANDLE_SUCCESS,
        HANDLE_ERROR: APPLICATION_GRAPH_NODES.HANDLE_ERROR,
        HANDLE_RETRY: APPLICATION_GRAPH_NODES.HANDLE_RETRY,
      },
      config: {
        MAX_RETRY_COUNT: APPLICATION_GRAPH_CONFIG.MAX_RETRY_COUNT,
      },
      logMessages: {
        workflowCompleted: 'Application graph completed successfully',
        workflowFailed: (error: string) => `Application graph execution failed: ${error}`,
        retryAttempt: APPLICATION_LOG_MESSAGES.RETRY_ATTEMPT,
      },
    };
  }

  protected getAdditionalSuccessData(): Partial<ApplicationStateType> {
    return { isCompleted: true, error: null };
  }

  protected getAdditionalErrorData(): Partial<ApplicationStateType> {
    return { isCompleted: true };
  }
}
