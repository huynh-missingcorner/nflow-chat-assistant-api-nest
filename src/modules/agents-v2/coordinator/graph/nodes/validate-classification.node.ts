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
      this.validateIntentsArray(state);
      this.validateAllIntents(state);

      this.logger.debug(LOG_MESSAGES.CLASSIFICATION_VALIDATED);
      this.logger.debug(`Validated ${state.classifiedIntent!.intents.length} intents successfully`);

      return this.createSuccessResult({
        currentNode: GRAPH_NODES.PROCESS_NEXT_INTENT,
      });
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

  private validateIntentsArray(state: CoordinatorStateType): void {
    const { intents } = state.classifiedIntent!;

    if (!intents) {
      throw new Error(VALIDATION_MESSAGES.NO_INTENTS_ARRAY);
    }

    if (intents.length === 0) {
      throw new Error(VALIDATION_MESSAGES.EMPTY_INTENTS_ARRAY);
    }
  }

  private validateAllIntents(state: CoordinatorStateType): void {
    const { intents } = state.classifiedIntent!;

    // Validate each intent
    intents.forEach((intent, index) => {
      this.validateRequiredFields(intent.domain, intent.intent, index);
      this.validateDomainIntentCombination(intent.domain, intent.intent, index);
    });

    // Validate dependencies if present
    if (state.classifiedIntent!.dependencies) {
      this.validateDependencies(state);
    }
  }

  private validateRequiredFields(domain: string, intent: string, index: number): void {
    if (!domain || !intent) {
      throw new Error(`Intent at index ${index}: ${VALIDATION_MESSAGES.MISSING_REQUIRED_FIELDS}`);
    }
  }

  private validateDomainIntentCombination(domain: string, intent: string, index: number): void {
    if (!this.validator.isValidCombination(domain, intent)) {
      throw new Error(
        `Intent at index ${index}: ${VALIDATION_MESSAGES.INVALID_COMBINATION(domain, intent)}`,
      );
    }
  }

  private validateDependencies(state: CoordinatorStateType): void {
    const { intents, dependencies } = state.classifiedIntent!;

    for (const dependency of dependencies!) {
      const { dependentIntentIndex, dependsOnIntentIndex } = dependency;

      // Check if indices are valid
      if (dependentIntentIndex < 0 || dependentIntentIndex >= intents.length) {
        throw new Error(`Invalid dependent intent index: ${dependentIntentIndex}`);
      }

      if (dependsOnIntentIndex < 0 || dependsOnIntentIndex >= intents.length) {
        throw new Error(`Invalid depends-on intent index: ${dependsOnIntentIndex}`);
      }

      // Check for circular dependencies
      if (this.hasCircularDependency(dependencies!, dependentIntentIndex, dependsOnIntentIndex)) {
        throw new Error(
          `Circular dependency detected between intents ${dependentIntentIndex} and ${dependsOnIntentIndex}`,
        );
      }
    }
  }

  private hasCircularDependency(
    dependencies: Array<{ dependentIntentIndex: number; dependsOnIntentIndex: number }>,
    start: number,
    current: number,
    visited: Set<number> = new Set(),
  ): boolean {
    if (current === start) {
      return true;
    }

    if (visited.has(current)) {
      return false;
    }

    visited.add(current);

    // Find all dependencies where the current node is dependent
    const nextDependencies = dependencies.filter((dep) => dep.dependentIntentIndex === current);

    for (const dep of nextDependencies) {
      if (this.hasCircularDependency(dependencies, start, dep.dependsOnIntentIndex, visited)) {
        return true;
      }
    }

    return false;
  }
}
