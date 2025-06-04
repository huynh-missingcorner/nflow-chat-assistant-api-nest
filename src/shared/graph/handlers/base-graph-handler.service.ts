import { Injectable, Logger } from '@nestjs/common';

export interface GraphStateBase {
  error?: string | null;
  retryCount?: number;
  currentNode?: string;
  isCompleted?: boolean;
}

export interface GraphHandlerConfig {
  maxRetryCount: number;
  logMessages: {
    workflowCompleted: string;
    workflowFailed: (error: string) => string;
    retryAttempt: (count: number) => string;
  };
}

@Injectable()
export class BaseGraphHandlerService<TState extends GraphStateBase> {
  private readonly logger = new Logger(BaseGraphHandlerService.name);

  handleSuccess<T extends TState>(
    state: T,
    config: GraphHandlerConfig,
    additionalData: Partial<T> = {} as Partial<T>,
  ): Partial<T> {
    this.logger.log(config.logMessages.workflowCompleted);

    return {
      ...additionalData,
      error: null,
      isCompleted: true,
    } as Partial<T>;
  }

  handleError<T extends TState>(
    state: T,
    config: GraphHandlerConfig,
    additionalData: Partial<T> = {} as Partial<T>,
  ): Partial<T> {
    const errorMessage = state.error || 'Unknown error';
    this.logger.error(config.logMessages.workflowFailed(errorMessage));

    return {
      ...additionalData,
      error: errorMessage,
      isCompleted: true,
    } as Partial<T>;
  }

  handleRetry<T extends TState>(
    state: T,
    config: GraphHandlerConfig,
    additionalData: Partial<T> = {} as Partial<T>,
  ): Partial<T> {
    const newRetryCount = this.incrementRetryCount(state);
    this.logger.warn(config.logMessages.retryAttempt(newRetryCount));

    if (this.isMaxRetryReached(newRetryCount, config.maxRetryCount)) {
      return this.handleError({ ...state, error: 'Maximum retry attempts exceeded' } as T, config, {
        ...additionalData,
        retryCount: newRetryCount,
      } as Partial<T>);
    }

    return {
      ...additionalData,
      retryCount: newRetryCount,
      error: null,
    } as Partial<T>;
  }

  private incrementRetryCount(state: TState): number {
    return (state.retryCount || 0) + 1;
  }

  private isMaxRetryReached(retryCount: number, maxRetries: number): boolean {
    return retryCount >= maxRetries;
  }
}
