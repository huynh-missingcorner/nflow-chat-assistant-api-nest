import { Injectable } from '@nestjs/common';

import { GRAPH_NODES, LOG_MESSAGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class ProcessNextIntentNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    try {
      if (!state.classifiedIntent || !state.classifiedIntent.intents.length) {
        return this.handleError(new Error('No intents to process'), 'processing next intent');
      }

      // Check if we've processed all intents
      if (state.currentIntentIndex >= state.classifiedIntent.intents.length) {
        this.logger.debug(LOG_MESSAGES.ALL_INTENTS_PROCESSED);

        return this.createSuccessResult({
          currentNode: GRAPH_NODES.HANDLE_SUCCESS,
        });
      }

      // Get the current intent
      const currentIntent = state.classifiedIntent.intents[state.currentIntentIndex];

      // Check if this intent has dependencies
      if (state.classifiedIntent.dependencies) {
        const dependencies = state.classifiedIntent.dependencies.filter(
          (dep) => dep.dependentIntentIndex === state.currentIntentIndex,
        );

        // Check if all dependencies have been processed
        for (const dependency of dependencies) {
          if (!state.processedIntents.includes(dependency.dependsOnIntentIndex)) {
            this.logger.debug(
              `Intent ${state.currentIntentIndex} depends on intent ${dependency.dependsOnIntentIndex} which has not been processed yet. Processing dependency first.`,
            );

            // Update to process the dependency first
            return this.createSuccessResult({
              currentIntentIndex: dependency.dependsOnIntentIndex,
            });
          }
        }
      }

      // Format target for logging - handle string, array, or undefined
      const targetDisplay = Array.isArray(currentIntent.target)
        ? currentIntent.target.join(', ')
        : currentIntent.target || 'undefined';

      this.logger.debug(
        `Processing intent ${state.currentIntentIndex}: ${currentIntent.domain}/${currentIntent.intent} for target: ${targetDisplay}`,
      );

      // Mark this intent as processed
      const processedIntents = [...state.processedIntents, state.currentIntentIndex];

      // Move to the next intent
      return this.createSuccessResult({
        processedIntents,
        currentIntentIndex: state.currentIntentIndex + 1,
      });
    } catch (error) {
      return this.handleError(error, 'processing next intent');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.PROCESS_NEXT_INTENT;
  }
}
