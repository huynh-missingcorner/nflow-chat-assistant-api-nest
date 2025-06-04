import { Injectable } from '@nestjs/common';

import { GRAPH_NODES, LOG_MESSAGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class ProcessNextIntentNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    try {
      this.logger.debug('ProcessNextIntentNode running...');

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
        `Ready to process intent ${state.currentIntentIndex}: ${currentIntent.domain}/${currentIntent.intent} for target: ${targetDisplay}`,
      );

      // For non-domain-specific intents (or domains without subgraphs),
      // mark as processed and move to next
      if (!this.isDomainWithSubgraph(currentIntent.domain)) {
        this.logger.debug(
          `No subgraph available for domain ${currentIntent.domain}, marking as processed`,
        );

        // Mark this intent as processed and move to the next intent
        const processedIntents = [...state.processedIntents, state.currentIntentIndex];

        return this.createSuccessResult({
          processedIntents,
          currentIntentIndex: state.currentIntentIndex + 1,
        });
      }

      // For domains with subgraphs, the routing will be handled by edge strategy
      // This node just prepares the state for routing
      return this.createSuccessResult({
        // Don't increment index here - let the subgraph handle it
      });
    } catch (error) {
      return this.handleError(error, 'processing next intent');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.PROCESS_NEXT_INTENT;
  }

  private isDomainWithSubgraph(domain: string): boolean {
    // Currently only application domain has a subgraph
    // Add other domains here as they get subgraphs
    return (
      domain === 'application' || domain === 'object' || domain === 'layout' || domain === 'flow'
    );
  }
}
