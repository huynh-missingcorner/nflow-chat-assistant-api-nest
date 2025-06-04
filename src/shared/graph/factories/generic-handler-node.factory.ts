import { Injectable } from '@nestjs/common';

import {
  BaseGraphHandlerService,
  GenericHandleErrorNode,
  GenericHandleRetryNode,
  GenericHandleSuccessNode,
  GraphHandlerConfig,
  GraphStateBase,
} from '../index';

export interface GraphConstants {
  nodes: {
    HANDLE_SUCCESS: string;
    HANDLE_ERROR: string;
    HANDLE_RETRY: string;
  };
  config: {
    MAX_RETRY_COUNT: number;
  };
  logMessages: {
    workflowCompleted: string;
    workflowFailed: (error: string) => string;
    retryAttempt: (count: number) => string;
  };
}

/**
 * Generic factory template for creating handler nodes for any graph type
 * This can be extended by specific graph implementations
 */
@Injectable()
export abstract class GenericHandlerNodeFactory<TState extends GraphStateBase> {
  constructor(protected readonly handlerService: BaseGraphHandlerService<TState>) {}

  protected abstract getGraphConstants(): GraphConstants;

  protected getHandlerConfig(): GraphHandlerConfig {
    const constants = this.getGraphConstants();
    return {
      maxRetryCount: constants.config.MAX_RETRY_COUNT,
      logMessages: constants.logMessages,
    };
  }

  protected getAdditionalSuccessData(): Partial<TState> {
    return {} as Partial<TState>;
  }

  protected getAdditionalErrorData(): Partial<TState> {
    return {} as Partial<TState>;
  }

  protected getAdditionalRetryData(): Partial<TState> {
    return {} as Partial<TState>;
  }

  createSuccessNode(): GenericHandleSuccessNode<TState> {
    const constants = this.getGraphConstants();
    return new GenericHandleSuccessNode(
      this.handlerService,
      this.getHandlerConfig(),
      constants.nodes.HANDLE_SUCCESS,
      this.getAdditionalSuccessData(),
    );
  }

  createErrorNode(): GenericHandleErrorNode<TState> {
    const constants = this.getGraphConstants();
    return new GenericHandleErrorNode(
      this.handlerService,
      this.getHandlerConfig(),
      constants.nodes.HANDLE_ERROR,
      this.getAdditionalErrorData(),
    );
  }

  createRetryNode(): GenericHandleRetryNode<TState> {
    const constants = this.getGraphConstants();
    return new GenericHandleRetryNode(
      this.handlerService,
      this.getHandlerConfig(),
      constants.nodes.HANDLE_RETRY,
      this.getAdditionalRetryData(),
    );
  }
}
