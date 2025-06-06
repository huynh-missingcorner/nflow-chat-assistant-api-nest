import { Injectable } from '@nestjs/common';

import { GRAPH_CONFIG, GRAPH_EDGES, GRAPH_NODES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';

export interface IEdgeRoutingStrategy {
  determineValidationRoute(): string;
  determineNextIntentOrErrorRoute(state: CoordinatorStateType): string;
  determineNextIntentOrSuccessRoute(state: CoordinatorStateType): string;
  determineIntentRoutingOrSuccessRoute(state: CoordinatorStateType): string;
  determineAfterSubgraphRoute(state: CoordinatorStateType): string;
}

@Injectable()
export class EdgeRoutingStrategy implements IEdgeRoutingStrategy {
  private hasCurrentIntentError(state: CoordinatorStateType): boolean {
    if (
      !state.classifiedIntent?.intents ||
      state.currentIntentIndex >= state.classifiedIntent.intents.length
    ) {
      return false;
    }

    const currentIntent = state.classifiedIntent.intents[state.currentIntentIndex];
    return currentIntent.id
      ? state.errors.some((error) => error.intentId === currentIntent.id)
      : false;
  }

  private getCurrentIntentRetryCount(state: CoordinatorStateType): number {
    if (
      !state.classifiedIntent?.intents ||
      state.currentIntentIndex >= state.classifiedIntent.intents.length
    ) {
      return 0;
    }

    const currentIntent = state.classifiedIntent.intents[state.currentIntentIndex];
    if (!currentIntent.id) {
      return 0;
    }

    const intentErrors = state.errors.filter((error) => error.intentId === currentIntent.id);
    return intentErrors.length > 0 ? Math.max(...intentErrors.map((e) => e.retryCount)) : 0;
  }

  determineValidationRoute(): string {
    // Always proceed to validation regardless of errors from other intents
    return GRAPH_EDGES.VALIDATE;
  }

  determineNextIntentOrErrorRoute(state: CoordinatorStateType): string {
    const currentIntentRetryCount = this.getCurrentIntentRetryCount(state);

    // If current intent has errors and hasn't exceeded retry limit, retry
    if (
      this.hasCurrentIntentError(state) &&
      currentIntentRetryCount < GRAPH_CONFIG.MAX_RETRY_COUNT
    ) {
      return GRAPH_EDGES.RETRY;
    }

    // Always proceed to next intent, even if current intent failed
    return GRAPH_EDGES.NEXT_INTENT;
  }

  determineNextIntentOrSuccessRoute(state: CoordinatorStateType): string {
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
    console.log(
      `determineIntentRoutingOrSuccessRoute: currentIntentIndex=${state.currentIntentIndex}, totalIntents=${state.classifiedIntent?.intents?.length || 0}`,
    );

    // Check if we have a current intent to route
    if (
      state.classifiedIntent &&
      state.classifiedIntent.intents &&
      state.currentIntentIndex < state.classifiedIntent.intents.length
    ) {
      const currentIntent = state.classifiedIntent.intents[state.currentIntentIndex];
      console.log(
        `Current intent domain: ${currentIntent.domain}, intent: ${currentIntent.intent}`,
      );

      // Route to appropriate domain subgraph regardless of previous errors
      if (currentIntent.domain === 'application') {
        console.log(`Routing to APPLICATION_DOMAIN`);
        return GRAPH_EDGES.APPLICATION_DOMAIN;
      }

      if (currentIntent.domain === 'object') {
        console.log(`Routing to OBJECT_DOMAIN`);
        return GRAPH_EDGES.OBJECT_DOMAIN;
      }

      // For other domains, continue to next intent (placeholder for future domain subgraphs)
      console.log(`Unsupported domain ${currentIntent.domain}, routing to NEXT_INTENT`);
      return GRAPH_EDGES.NEXT_INTENT;
    }

    // No more intents to process - go to success (errors will be included in final state)
    console.log(`No more intents to process, routing to SUCCESS`);
    return GRAPH_EDGES.SUCCESS;
  }

  determineAfterSubgraphRoute(state: CoordinatorStateType): string {
    // After subgraph execution, always check if we have more intents to process
    // Don't stop on errors - continue processing all intents
    console.log(
      `determineAfterSubgraphRoute: currentIntentIndex=${state.currentIntentIndex}, totalIntents=${state.classifiedIntent?.intents?.length || 0}`,
    );

    if (
      state.classifiedIntent &&
      state.classifiedIntent.intents &&
      state.currentIntentIndex < state.classifiedIntent.intents.length
    ) {
      console.log(`Routing to NEXT_INTENT from after subgraph`);
      return GRAPH_EDGES.NEXT_INTENT;
    }

    // All intents processed - go to success regardless of individual intent errors
    console.log(`All intents processed, routing to SUCCESS`);
    return GRAPH_EDGES.SUCCESS;
  }
}
