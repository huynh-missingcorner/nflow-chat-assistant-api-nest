import { Logger } from '@nestjs/common';

import { ApplicationStateType } from '../types/application-graph-state.types';

export abstract class ApplicationGraphNodeBase {
  protected readonly logger = new Logger(this.constructor.name);

  abstract execute(
    state: ApplicationStateType,
  ): Promise<Partial<ApplicationStateType>> | Partial<ApplicationStateType>;

  protected handleError(error: unknown, context: string): Partial<ApplicationStateType> {
    const errorMessage = error instanceof Error ? error.message : `Unknown error in ${context}`;
    this.logger.error(`Error in ${context}:`, error);

    return {
      error: errorMessage,
      currentNode: this.getNodeName(),
    };
  }

  protected abstract getNodeName(): string;

  protected createSuccessResult(
    data: Partial<ApplicationStateType>,
  ): Partial<ApplicationStateType> {
    return {
      ...data,
      currentNode: this.getNodeName(),
    };
  }

  protected incrementRetryCount(state: ApplicationStateType): number {
    return (state.retryCount || 0) + 1;
  }

  protected isMaxRetryReached(retryCount: number, maxRetries: number = 3): boolean {
    return retryCount >= maxRetries;
  }
}
