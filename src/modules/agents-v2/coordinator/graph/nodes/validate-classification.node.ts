import { Injectable } from '@nestjs/common';

import { GRAPH_NODES, LOG_MESSAGES, VALIDATION_MESSAGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { IntentCombinationValidator } from '../validators/intent-combination.validator';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class ValidateClassificationNode extends GraphNodeBase {
  constructor(private readonly validator: IntentCombinationValidator) {
    super();
  }

  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    try {
      this.validateClassifiedIntent(state);
      this.validateRequiredFields(state);
      this.validateDomainIntentCombination(state);

      this.logger.debug(LOG_MESSAGES.CLASSIFICATION_VALIDATED);

      return this.createSuccessResult({});
    } catch (error) {
      return this.handleError(error, 'validation');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.VALIDATE_CLASSIFICATION;
  }

  private validateClassifiedIntent(state: CoordinatorStateType): void {
    if (!state.classifiedIntent) {
      throw new Error(VALIDATION_MESSAGES.NO_CLASSIFIED_INTENT);
    }
  }

  private validateRequiredFields(state: CoordinatorStateType): void {
    const { domain, intent } = state.classifiedIntent!;

    if (!domain || !intent) {
      throw new Error(VALIDATION_MESSAGES.MISSING_REQUIRED_FIELDS);
    }
  }

  private validateDomainIntentCombination(state: CoordinatorStateType): void {
    const { domain, intent } = state.classifiedIntent!;

    if (!this.validator.isValidCombination(domain, intent)) {
      throw new Error(VALIDATION_MESSAGES.INVALID_COMBINATION(domain, intent));
    }
  }
}
