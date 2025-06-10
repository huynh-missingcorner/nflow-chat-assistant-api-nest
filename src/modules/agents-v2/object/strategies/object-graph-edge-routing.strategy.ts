import { Injectable, Logger } from '@nestjs/common';

import { IntentEnum } from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';

import {
  ERROR_TEMPLATES,
  EXECUTION_STATUS,
  MESSAGE_TEMPLATES,
  OBJECT_GRAPH_EDGES,
} from '../constants/object-graph.constants';
import { ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class ObjectGraphEdgeRoutingStrategy {
  private readonly logger = new Logger(ObjectGraphEdgeRoutingStrategy.name);

  determineInitialRoute(state: ObjectStateType): string {
    if (!state.intent) {
      this.logger.warn(ERROR_TEMPLATES.NO_INTENT_FOUND);
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    const intentAction = state.intent.intent;

    switch (intentAction) {
      case IntentEnum.enum.design_data_schema:
        this.logger.log(MESSAGE_TEMPLATES.DESIGN_DATA_SCHEMA_ROUTING);
        return OBJECT_GRAPH_EDGES.SCHEMA_UNDERSTANDING;

      case IntentEnum.enum.create_object:
      case IntentEnum.enum.update_object_metadata:
        this.logger.log(MESSAGE_TEMPLATES.SINGLE_OBJECT_ROUTING);
        return OBJECT_GRAPH_EDGES.OBJECT_UNDERSTANDING;

      case IntentEnum.enum.manipulate_object_fields:
        this.logger.log(MESSAGE_TEMPLATES.FIELD_MANIPULATION_CREATE_ROUTING);
        return OBJECT_GRAPH_EDGES.FIELD_UNDERSTANDING;

      case IntentEnum.enum.delete_object:
        this.logger.log(MESSAGE_TEMPLATES.DELETE_OBJECT_ROUTING);
        return OBJECT_GRAPH_EDGES.OBJECT_EXECUTION;

      default:
        this.logger.warn(ERROR_TEMPLATES.UNKNOWN_INTENT_ACTION(intentAction));
        return OBJECT_GRAPH_EDGES.FIELD_UNDERSTANDING;
    }
  }

  determineAfterUnderstandingRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    // Check if any spec was extracted
    if (!state.fieldSpec && !state.objectSpec && !state.schemaSpec) {
      this.logger.warn(ERROR_TEMPLATES.NO_SPEC_EXTRACTED);
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    // All understanding nodes route to DB design
    this.logger.log(MESSAGE_TEMPLATES.UNDERSTANDING_COMPLETED_ROUTING);
    return OBJECT_GRAPH_EDGES.DB_DESIGN;
  }

  /**
   * Determine routing after field understanding specifically
   * Routes directly to TYPE_MAPPER for field-only operations on existing objects
   */
  determineAfterFieldUnderstandingRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (!state.fieldSpec) {
      this.logger.warn(ERROR_TEMPLATES.NO_SPEC_EXTRACTED);
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    // If field has an objectName (targeting existing object), skip DB design and go to type mapping
    if (state.fieldSpec.objectName) {
      this.logger.log('Field targeting existing object - routing directly to type mapping');
      return OBJECT_GRAPH_EDGES.TYPE_MAPPING;
    }

    return OBJECT_GRAPH_EDGES.ERROR;
  }

  determineAfterDesignRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    // Schema design - go directly to schema execution
    if (state.isSchemaDesign && state.schemaDesignResult) {
      if (!state.schemaDesignResult.valid) {
        this.logger.warn(
          ERROR_TEMPLATES.SCHEMA_DESIGN_VALIDATION_FAILED('Schema design validation failed'),
        );
        return OBJECT_GRAPH_EDGES.ERROR;
      }
      this.logger.log(MESSAGE_TEMPLATES.SCHEMA_DESIGN_COMPLETED_ROUTING);
      return OBJECT_GRAPH_EDGES.SCHEMA_EXECUTION;
    }

    // Single object design - go to type mapping
    if (!state.dbDesignResult) {
      this.logger.warn(ERROR_TEMPLATES.NO_DB_DESIGN_RESULT);
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    if (!state.dbDesignResult.valid) {
      this.logger.warn(ERROR_TEMPLATES.DB_DESIGN_VALIDATION_FAILED('DB design validation failed'));
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    this.logger.log(MESSAGE_TEMPLATES.OBJECT_DESIGN_COMPLETED_ROUTING);
    return OBJECT_GRAPH_EDGES.TYPE_MAPPING;
  }

  determineAfterMappingRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (!state.typeMappingResult) {
      this.logger.warn(ERROR_TEMPLATES.NO_TYPE_MAPPING_RESULT);
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    if (state.typeMappingResult.errors && state.typeMappingResult.errors.length > 0) {
      this.logger.warn(ERROR_TEMPLATES.TYPE_MAPPING_ERRORS_DETECTED);
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    if (
      !state.typeMappingResult.mappedFields ||
      state.typeMappingResult.mappedFields.length === 0
    ) {
      this.logger.warn(ERROR_TEMPLATES.NO_MAPPED_FIELDS);
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    // Determine routing based on operation type
    // If fieldSpec has an objectName (targeting existing object), use field executor
    if (state.fieldSpec?.objectName) {
      this.logger.log('Field operation on existing object - routing to field executor');
      return OBJECT_GRAPH_EDGES.FIELD_EXECUTION;
    }

    // Otherwise, use object executor for full object creation with fields
    this.logger.log(MESSAGE_TEMPLATES.TYPE_MAPPING_COMPLETED_ROUTING);
    return OBJECT_GRAPH_EDGES.OBJECT_EXECUTION;
  }

  determineAfterExecutionRoute(state: ObjectStateType): string {
    if (state.error) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    // Handle schema execution results
    if (state.isSchemaDesign && state.schemaExecutionResult) {
      if (state.schemaExecutionResult.status === EXECUTION_STATUS.FAILED) {
        this.logger.warn(ERROR_TEMPLATES.SCHEMA_EXECUTION_FAILED);
        return OBJECT_GRAPH_EDGES.ERROR;
      }

      if (state.schemaExecutionResult.status === EXECUTION_STATUS.PARTIAL) {
        this.logger.warn(ERROR_TEMPLATES.SCHEMA_EXECUTION_PARTIAL);
        return OBJECT_GRAPH_EDGES.RETRY;
      }

      return OBJECT_GRAPH_EDGES.SUCCESS;
    }

    // Handle single object execution results
    if (!state.executionResult) {
      this.logger.warn(ERROR_TEMPLATES.NO_EXECUTION_RESULT);
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    if (state.executionResult.status === EXECUTION_STATUS.FAILED) {
      // Check if any steps were completed successfully
      const hasCompletedSteps =
        state.executionResult.completedSteps && state.executionResult.completedSteps.length > 0;

      if (hasCompletedSteps) {
        this.logger.warn(ERROR_TEMPLATES.EXECUTION_FAILED_WITH_COMPLETED_STEPS);
        return OBJECT_GRAPH_EDGES.RETRY;
      } else {
        this.logger.warn(ERROR_TEMPLATES.EXECUTION_FAILED_NO_COMPLETED_STEPS);
        return OBJECT_GRAPH_EDGES.ERROR;
      }
    }

    if (state.executionResult.status === EXECUTION_STATUS.PARTIAL) {
      this.logger.warn(ERROR_TEMPLATES.PARTIAL_EXECUTION);
      return OBJECT_GRAPH_EDGES.RETRY;
    }

    return OBJECT_GRAPH_EDGES.SUCCESS;
  }

  determineRetryRoute(state: ObjectStateType): string {
    // Check if we've exceeded retry limits (handled in HandleRetryNode)
    if (state.error && state.error.includes(ERROR_TEMPLATES.MAXIMUM_RETRY_EXCEEDED)) {
      return OBJECT_GRAPH_EDGES.ERROR;
    }

    // If we have partial execution results with completed steps,
    // go directly back to execution to continue from where we left off
    if (
      state.executionResult &&
      state.executionResult.completedSteps &&
      state.executionResult.completedSteps.length > 0
    ) {
      this.logger.log(MESSAGE_TEMPLATES.RETRY_WITH_COMPLETED_STEPS);

      // Determine which executor to retry based on the operation type
      if (state.fieldSpec?.objectName) {
        this.logger.log('Retrying field execution');
        return OBJECT_GRAPH_EDGES.FIELD_EXECUTION;
      } else {
        return OBJECT_GRAPH_EDGES.OBJECT_EXECUTION;
      }
    }

    // For schema execution retries
    if (state.isSchemaDesign) {
      this.logger.log(MESSAGE_TEMPLATES.SCHEMA_EXECUTION_RETRY);
      return OBJECT_GRAPH_EDGES.FIELD_UNDERSTANDING;
    }

    // Otherwise, restart from the beginning for object execution
    this.logger.log(MESSAGE_TEMPLATES.OBJECT_EXECUTION_RETRY);
    return OBJECT_GRAPH_EDGES.FIELD_UNDERSTANDING;
  }
}
