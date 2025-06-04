import { Injectable } from '@nestjs/common';

import { GRAPH_CONFIG, GRAPH_EDGES, GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';

export interface IEdgeRoutingStrategy {
  determineValidationRoute(state: CoordinatorStateType): string;
  determineNextIntentOrErrorRoute(state: CoordinatorStateType): string;
  determineNextIntentOrSuccessRoute(state: CoordinatorStateType): string;
  determineIntentRoutingOrSuccessRoute(state: CoordinatorStateType): string;
  determineAfterSubgraphRoute(state: CoordinatorStateType): string;
}

@Injectable()
export class EdgeRoutingStrategy implements IEdgeRoutingStrategy {
  determineValidationRoute(state: CoordinatorStateType): string {
    if (state.error) {
      return GRAPH_EDGES.ERROR;
    }
    return GRAPH_EDGES.VALIDATE;
  }

  determineNextIntentOrErrorRoute(state: CoordinatorStateType): string {
    if (state.error && state.retryCount < GRAPH_CONFIG.MAX_RETRY_COUNT) {
      return GRAPH_EDGES.RETRY;
    }
    if (state.error) {
      return GRAPH_EDGES.ERROR;
    }
    return GRAPH_EDGES.NEXT_INTENT;
  }

  determineNextIntentOrSuccessRoute(state: CoordinatorStateType): string {
    if (state.error) {
      return GRAPH_EDGES.ERROR;
    }

    // Check if we're done processing all intents
    if (state.currentNode === GRAPH_NODES.HANDLE_SUCCESS) {
      return GRAPH_EDGES.SUCCESS;
    }

    // Check if we have more intents to process
    if (
      state.classifiedIntent &&
      state.classifiedIntent.intents &&
      state.currentIntentIndex < state.classifiedIntent.intents.length
    ) {
      return GRAPH_EDGES.NEXT_INTENT;
    }

    return GRAPH_EDGES.SUCCESS;
  }

  determineIntentRoutingOrSuccessRoute(state: CoordinatorStateType): string {
    if (state.error) {
      return GRAPH_EDGES.ERROR;
    }

    // Check if we have a current intent to route
    if (
      state.classifiedIntent &&
      state.classifiedIntent.intents &&
      state.currentIntentIndex < state.classifiedIntent.intents.length
    ) {
      const currentIntent = state.classifiedIntent.intents[state.currentIntentIndex];

      // Route to appropriate domain subgraph
      if (currentIntent.domain === 'application') {
        return GRAPH_EDGES.APPLICATION_DOMAIN;
      }

      if (currentIntent.domain === 'object') {
        return GRAPH_EDGES.OBJECT_DOMAIN;
      }

      // For other domains, continue to next intent (placeholder for future domain subgraphs)
      return GRAPH_EDGES.NEXT_INTENT;
    }

    // No more intents to process
    return GRAPH_EDGES.SUCCESS;
  }

  determineAfterSubgraphRoute(state: CoordinatorStateType): string {
    if (state.error) {
      return GRAPH_EDGES.ERROR;
    }

    // After subgraph execution, check if we have more intents to process
    if (
      state.classifiedIntent &&
      state.classifiedIntent.intents &&
      state.currentIntentIndex < state.classifiedIntent.intents.length
    ) {
      return GRAPH_EDGES.NEXT_INTENT;
    }

    return GRAPH_EDGES.SUCCESS;
  }
}
