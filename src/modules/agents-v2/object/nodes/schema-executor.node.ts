import { Injectable, Logger } from '@nestjs/common';

import { ERROR_TEMPLATES, OBJECT_GRAPH_NODES } from '../constants/object-graph.constants';
import { SchemaExecutorService } from '../services/schema-executor.service';
import { ObjectStateType, SchemaExecutionResult } from '../types/object-graph-state.types';

@Injectable()
export class SchemaExecutorNode {
  private readonly logger = new Logger(SchemaExecutorNode.name);

  constructor(private readonly schemaExecutorService: SchemaExecutorService) {}

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log('Schema execution started');

      if (!state.schemaDesignResult || !state.schemaSpec) {
        return this.createErrorResult(ERROR_TEMPLATES.SCHEMA_SPEC_MISSING);
      }

      // Get userId from chatSessionId
      let userId: string;
      try {
        userId = await this.schemaExecutorService.getUserIdFromChatSession(state.chatSessionId);
      } catch (error) {
        this.logger.error('Failed to get userId from chatSessionId', error);
        return this.createErrorResult(
          `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      const schemaExecutionResult = await this.schemaExecutorService.executeSchema(
        state.schemaSpec,
        state.schemaDesignResult,
        {
          userId,
          objectNameMapping: state.objectNameMapping
            ? new Map(Object.entries(state.objectNameMapping))
            : undefined,
        },
        state,
      );

      // Always return execution results, regardless of status
      // This ensures that successful operations are reported even when some objects fail
      if (schemaExecutionResult.status === 'failed') {
        // Check if there were any successful operations
        const hasSuccessfulOperations =
          schemaExecutionResult.completedObjects &&
          schemaExecutionResult.completedObjects.length > 0;

        if (!hasSuccessfulOperations) {
          // Only return error result if absolutely no objects were created
          return this.createErrorResult(
            ERROR_TEMPLATES.SCHEMA_EXECUTION_ERROR(
              schemaExecutionResult.errors?.join(', ') || 'Unknown error',
            ),
            schemaExecutionResult,
          );
        } else {
          // Even though status is failed, we have some successful operations
          // Return success result with the execution result containing both successes and failures
          return this.createSuccessResult(schemaExecutionResult);
        }
      }

      // For success and partial status, always return success result
      return this.createSuccessResult(schemaExecutionResult);
    } catch (error) {
      this.logger.error(ERROR_TEMPLATES.SCHEMA_EXECUTION_ERROR('Schema execution failed'), error);
      return this.createErrorResult(
        error instanceof Error
          ? error.message
          : ERROR_TEMPLATES.SCHEMA_EXECUTION_ERROR('Unknown error'),
      );
    }
  }

  private createErrorResult(
    errorMessage: string,
    schemaExecutionResult?: SchemaExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      error: ERROR_TEMPLATES.SCHEMA_EXECUTION_ERROR(errorMessage),
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      schemaExecutionResult,
    };
  }

  private createSuccessResult(
    schemaExecutionResult: SchemaExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      schemaExecutionResult,
      isCompleted: true,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
    };
  }
}
