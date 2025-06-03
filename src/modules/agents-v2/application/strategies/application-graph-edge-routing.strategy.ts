import { Injectable } from '@nestjs/common';

import {
  APPLICATION_GRAPH_CONFIG,
  APPLICATION_GRAPH_EDGES,
} from '../constants/application-graph.constants';
import { ApplicationStateType } from '../types/application-graph-state.types';

@Injectable()
export class ApplicationGraphEdgeRoutingStrategy {
  determineAfterUnderstandingRoute(state: ApplicationStateType): string {
    if (state.error) {
      return this.shouldRetry(state)
        ? APPLICATION_GRAPH_EDGES.RETRY
        : APPLICATION_GRAPH_EDGES.ERROR;
    }

    if (state.applicationSpec) {
      return APPLICATION_GRAPH_EDGES.DESIGN;
    }

    return APPLICATION_GRAPH_EDGES.ERROR;
  }

  determineAfterDesignRoute(state: ApplicationStateType): string {
    if (state.error) {
      return this.shouldRetry(state)
        ? APPLICATION_GRAPH_EDGES.RETRY
        : APPLICATION_GRAPH_EDGES.ERROR;
    }

    if (state.enrichedSpec) {
      return APPLICATION_GRAPH_EDGES.EXECUTE;
    }

    return APPLICATION_GRAPH_EDGES.ERROR;
  }

  determineAfterExecutionRoute(state: ApplicationStateType): string {
    if (state.error) {
      return this.shouldRetry(state)
        ? APPLICATION_GRAPH_EDGES.RETRY
        : APPLICATION_GRAPH_EDGES.ERROR;
    }

    if (state.executionResult && state.executionResult.status === 'success') {
      return APPLICATION_GRAPH_EDGES.SUCCESS;
    }

    if (state.executionResult && state.executionResult.status === 'failed') {
      return this.shouldRetry(state)
        ? APPLICATION_GRAPH_EDGES.RETRY
        : APPLICATION_GRAPH_EDGES.ERROR;
    }

    return APPLICATION_GRAPH_EDGES.ERROR;
  }

  determineRetryRoute(state: ApplicationStateType): string {
    if (this.shouldRetry(state)) {
      return APPLICATION_GRAPH_EDGES.RETRY;
    }

    return APPLICATION_GRAPH_EDGES.ERROR;
  }

  private shouldRetry(state: ApplicationStateType): boolean {
    const currentRetryCount = state.retryCount || 0;
    return currentRetryCount < APPLICATION_GRAPH_CONFIG.MAX_RETRY_COUNT;
  }
}
