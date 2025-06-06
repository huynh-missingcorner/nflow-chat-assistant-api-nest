import { Injectable, Logger } from '@nestjs/common';

import { OBJECT_GRAPH_EDGES } from '../constants/object-graph.constants';
import { ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class ObjectGraphEdgeRoutingStrategy {
  private readonly logger = new Logger(ObjectGraphEdgeRoutingStrategy.name);

  determineInitialRoute(state: ObjectStateType): string {
    if (!state.intent) {
      this.logger.warn('No intent found in state, defaulting to error');
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    const intent = state.intent;
    const intentAction = intent.intent;

    switch (intentAction) {
      case 'create_object':
        return OBJECT_GRAPH_EDGES.DESIGN;
      case 'update_object_metadata':
      case 'design_data_schema':
        return OBJECT_GRAPH_EDGES.DESIGN;

      case 'manipulate_object_fields': {
        const details: unknown = intent.details;
        const detailsStr = typeof details === 'string' ? details : '';
        if (detailsStr && (detailsStr.includes('add') || detailsStr.includes('create'))) {
          return OBJECT_GRAPH_EDGES.UNDERSTAND;
        }
        return OBJECT_GRAPH_EDGES.DESIGN;
      }

      case 'delete_object':
        return OBJECT_GRAPH_EDGES.EXECUTE;

      default:
        this.logger.warn(
          `Unknown intent action: ${intentAction}, defaulting to field understanding`,
        );
        return OBJECT_GRAPH_EDGES.UNDERSTAND;
    }
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
      // Check if any steps were completed successfully
      const hasCompletedSteps =
        state.executionResult.completedSteps && state.executionResult.completedSteps.length > 0;

      if (hasCompletedSteps) {
        this.logger.warn(
          'Execution failed but has completed steps, routing to retry for remaining steps',
        );
        return OBJECT_GRAPH_EDGES.RETRY;
      } else {
        this.logger.warn('Execution failed with no completed steps, routing to error');
        return OBJECT_GRAPH_EDGES.ERROR;
      }
    }

    if (state.executionResult.status === 'partial') {
      this.logger.warn('Partial execution, routing to retry for remaining steps');
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    return OBJECT_GRAPH_EDGES.SUCCESS;
  }

  determineRetryRoute(state: ObjectStateType): string {
    // Check if we've exceeded retry limits (handled in HandleRetryNode)
    if (state.error && state.error.includes('Maximum retry')) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    // If we have partial execution results with completed steps,
    // go directly back to execution to continue from where we left off
    if (
      state.executionResult &&
      state.executionResult.completedSteps &&
      state.executionResult.completedSteps.length > 0
    ) {
      this.logger.log('Retrying with completed steps, going directly to execution');
      return OBJECT_GRAPH_EDGES.EXECUTE;
    }

    // Otherwise, restart from the beginning
    return OBJECT_GRAPH_EDGES.RETRY;
  }
}
