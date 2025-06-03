import { Injectable } from '@nestjs/common';

import { GRAPH_NODES } from '../constants/graph-constants';
import { IntentSchema } from '../tools/intent-classifier.tool';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class PrepareApplicationSubgraphNode extends GraphNodeBase {
  execute(state: CoordinatorStateType): Partial<CoordinatorStateType> {
    try {
      if (!state.classifiedIntent || !state.classifiedIntent.intents.length) {
        return this.handleError(
          new Error('No intents to process'),
          'preparing application subgraph',
        );
      }

      if (state.currentIntentIndex >= state.classifiedIntent.intents.length) {
        return this.handleError(
          new Error('Invalid intent index'),
          'preparing application subgraph',
        );
      }

      const currentIntent = state.classifiedIntent.intents[state.currentIntentIndex];

      if (currentIntent.domain !== 'application') {
        return this.handleError(
          new Error(`Invalid domain for application subgraph: ${currentIntent.domain}`),
          'preparing application subgraph',
        );
      }

      // Prepare the state for the application subgraph
      // Create a contextualized message for the application domain
      const applicationMessage = this.buildApplicationMessage(currentIntent, state.originalMessage);

      this.logger.debug(
        `Preparing application subgraph for intent: ${currentIntent.intent} with target: ${
          Array.isArray(currentIntent.target)
            ? currentIntent.target.join(', ')
            : currentIntent.target || 'undefined'
        }`,
      );

      // Return state updates that will be passed to the application subgraph
      return this.createSuccessResult({
        originalMessage: applicationMessage,
        // Clear any previous application state to ensure clean subgraph execution
        applicationSpec: null,
        enrichedSpec: null,
        executionResult: null,
        isCompleted: false,
      });
    } catch (error) {
      return this.handleError(error, 'preparing application subgraph');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.PREPARE_APPLICATION_SUBGRAPH;
  }

  private buildApplicationMessage(intent: IntentSchema, originalMessage: string): string {
    // Create a contextualized message for the application agent
    const intentDetails = intent.details ? ` Details: ${JSON.stringify(intent.details)}` : '';
    const targetInfo = intent.target
      ? ` Target: ${Array.isArray(intent.target) ? intent.target.join(', ') : intent.target}`
      : '';

    return `${intent.intent} request: ${originalMessage}${targetInfo}${intentDetails}`;
  }
}
