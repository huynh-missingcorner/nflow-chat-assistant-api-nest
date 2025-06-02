import { Injectable } from '@nestjs/common';

import { GRAPH_CONFIG, GRAPH_EDGES } from '../constants/graph-constants';
import { CoordinatorStateType } from '../types/graph-state.types';

export interface IEdgeRoutingStrategy {
  determineValidationRoute(state: CoordinatorStateType): string;
  determineRetryOrSucceedRoute(state: CoordinatorStateType): string;
}

@Injectable()
export class EdgeRoutingStrategy implements IEdgeRoutingStrategy {
  determineValidationRoute(state: CoordinatorStateType): string {
    if (state.error) {
      return GRAPH_EDGES.ERROR;
    }
    return GRAPH_EDGES.VALIDATE;
  }

  determineRetryOrSucceedRoute(state: CoordinatorStateType): string {
    if (state.error && state.retryCount < GRAPH_CONFIG.MAX_RETRY_COUNT) {
      return GRAPH_EDGES.RETRY;
    }
    if (state.error) {
      return GRAPH_EDGES.ERROR;
    }
    return GRAPH_EDGES.SUCCESS;
  }
}
