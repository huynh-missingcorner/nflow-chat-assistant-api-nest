import { Injectable } from '@nestjs/common';

import { GRAPH_CONFIG, GRAPH_EDGES, GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';

export interface IEdgeRoutingStrategy {
  determineValidationRoute(state: CoordinatorStateType): string;
  determineNextIntentOrErrorRoute(state: CoordinatorStateType): string;
  determineNextIntentOrSuccessRoute(state: CoordinatorStateType): string;
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
}
