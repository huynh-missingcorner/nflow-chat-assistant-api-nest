import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CoordinatorStateType, IntentError } from '../types/graph-state.types';

export abstract class GraphNodeBase {
  protected readonly logger = new Logger(this.constructor.name);

  abstract execute(
    state: CoordinatorStateType,
  ): Promise<Partial<CoordinatorStateType>> | Partial<CoordinatorStateType>;

  protected handleError(
    error: unknown,
    context: string,
    intentId?: string,
  ): Partial<CoordinatorStateType> {
    const errorMessage = error instanceof Error ? error.message : `Unknown error in ${context}`;
    this.logger.error(`Error in ${context}:`, error);

    const errors: IntentError[] = [];

    // If we have an intent ID, create a specific error for that intent
    if (intentId) {
      errors.push({
        intentId,
        errorMessage,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      });
    } else {
      // For general errors without specific intent, create a generic error ID
      errors.push({
        intentId: `general-error-${uuidv4()}`,
        errorMessage,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      });
    }

    return {
      errors,
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
