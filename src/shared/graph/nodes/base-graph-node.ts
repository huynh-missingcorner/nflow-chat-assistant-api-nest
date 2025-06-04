import { Logger } from '@nestjs/common';

import { GraphStateBase } from '../handlers/base-graph-handler.service';

export abstract class BaseGraphNode<TState extends GraphStateBase> {
  protected readonly logger = new Logger(this.constructor.name);

  abstract execute(state: TState): Promise<Partial<TState>> | Partial<TState>;

  protected handleError(error: unknown, context: string): Partial<TState> {
    const errorMessage = error instanceof Error ? error.message : `Unknown error in ${context}`;
    this.logger.error(`Error in ${context}:`, error);

    return {
      error: errorMessage,
      currentNode: this.getNodeName(),
    } as Partial<TState>;
  }

  protected abstract getNodeName(): string;

  protected createSuccessResult(data: Partial<TState>): Partial<TState> {
    return {
      ...data,
      currentNode: this.getNodeName(),
    } as Partial<TState>;
  }
}
