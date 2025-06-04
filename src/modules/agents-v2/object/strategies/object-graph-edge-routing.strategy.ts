import { Injectable, Logger } from '@nestjs/common';

import { OBJECT_GRAPH_EDGES } from '../constants/object-graph.constants';
import { ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class ObjectGraphEdgeRoutingStrategy {
  private readonly logger = new Logger(ObjectGraphEdgeRoutingStrategy.name);

  determineInitialRoute(state: ObjectStateType): string {
    // Determine if we're dealing with a single field or complete object
    // This logic could be enhanced with more sophisticated intent detection
    const message = state.originalMessage?.toLowerCase() || '';

    if (
      message.includes('add field') ||
      message.includes('create field') ||
      message.includes('field')
    ) {
      return OBJECT_GRAPH_EDGES.UNDERSTAND; // Field understanding
    } else if (
      message.includes('create object') ||
      message.includes('new object') ||
      message.includes('object')
    ) {
      return OBJECT_GRAPH_EDGES.DESIGN; // Object understanding
    }

    // Default to field understanding
    return OBJECT_GRAPH_EDGES.UNDERSTAND;
  }

  determineAfterUnderstandingRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (!state.fieldSpec && !state.objectSpec) {
      this.logger.warn('No field or object spec extracted, routing to retry');
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    return OBJECT_GRAPH_EDGES.DESIGN;
  }

  determineAfterDesignRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (!state.dbDesignResult) {
      this.logger.warn('No DB design result, routing to retry');
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    if (!state.dbDesignResult.valid) {
      this.logger.warn('DB design validation failed, routing to error');
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    return OBJECT_GRAPH_EDGES.MAP_TYPES;
  }

  determineAfterMappingRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (!state.typeMappingResult) {
      this.logger.warn('No type mapping result, routing to retry');
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    if (state.typeMappingResult.errors && state.typeMappingResult.errors.length > 0) {
      this.logger.warn('Type mapping errors detected, routing to error');
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (
      !state.typeMappingResult.mappedFields ||
      state.typeMappingResult.mappedFields.length === 0
    ) {
      this.logger.warn('No mapped fields, routing to retry');
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    return OBJECT_GRAPH_EDGES.EXECUTE;
  }

  determineAfterExecutionRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (!state.executionResult) {
      this.logger.warn('No execution result, routing to retry');
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    if (state.executionResult.status === 'failed') {
      this.logger.warn('Execution failed, routing to error');
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (state.executionResult.status === 'partial') {
      this.logger.warn('Partial execution, routing to retry');
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    return OBJECT_GRAPH_EDGES.SUCCESS;
  }

  determineRetryRoute(state: ObjectStateType): string {
    // Check if we've exceeded retry limits (handled in HandleRetryNode)
    if (state.error && state.error.includes('Maximum retry')) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    return OBJECT_GRAPH_EDGES.RETRY;
  }
}
