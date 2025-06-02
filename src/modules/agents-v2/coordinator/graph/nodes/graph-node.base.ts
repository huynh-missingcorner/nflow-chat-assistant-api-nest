import { Logger } from '@nestjs/common';

import { CoordinatorStateType } from '../types/graph-state.types';

export abstract class GraphNodeBase {
  protected readonly logger = new Logger(this.constructor.name);

  abstract execute(
    state: CoordinatorStateType,
  ): Promise<Partial<CoordinatorStateType>> | Partial<CoordinatorStateType>;

  protected handleError(error: unknown, context: string): Partial<CoordinatorStateType> {
    const errorMessage = error instanceof Error ? error.message : `Unknown error in ${context}`;
    this.logger.error(`Error in ${context}:`, error);

    return {
      error: errorMessage,
      currentNode: this.getNodeName(),
    };
  }

  protected abstract getNodeName(): string;

  protected createSuccessResult(
    data: Partial<CoordinatorStateType>,
  ): Partial<CoordinatorStateType> {
    return {
      ...data,
      currentNode: this.getNodeName(),
    };
  }
}
