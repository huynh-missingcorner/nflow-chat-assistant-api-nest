import { Logger } from '@nestjs/common';

import { ObjectStateType } from '../types/object-graph-state.types';

export abstract class ObjectGraphNodeBase {
  protected readonly logger = new Logger(this.constructor.name);

  abstract execute(
    state: ObjectStateType,
  ): Promise<Partial<ObjectStateType>> | Partial<ObjectStateType>;

  protected handleError(error: unknown, context: string): Partial<ObjectStateType> {
    const errorMessage = error instanceof Error ? error.message : `Unknown error in ${context}`;
    this.logger.error(`Error in ${context}:`, error);

    return {
      error: errorMessage,
      currentNode: this.getNodeName(),
    };
  }

  protected abstract getNodeName(): string;

  protected createSuccessResult(data: Partial<ObjectStateType>): Partial<ObjectStateType> {
    return {
      ...data,
      currentNode: this.getNodeName(),
    };
  }

  protected incrementRetryCount(state: ObjectStateType): number {
    return (state.retryCount || 0) + 1;
  }

  protected isMaxRetryReached(retryCount: number, maxRetries: number = 3): boolean {
    return retryCount >= maxRetries;
  }
}
