import { Injectable, Logger } from '@nestjs/common';
import { SystemMessage } from '@langchain/core/messages';

import {
  ERROR_TEMPLATES,
  EXECUTION_STATUS,
  MESSAGE_TEMPLATES,
  OBJECT_GRAPH_NODES,
} from '../constants/object-graph.constants';
import {
  ExecutionStatus,
  ObjectExecutionResult,
  ObjectSpec,
  ObjectStateType,
  SchemaExecutionResult,
} from '../types/object-graph-state.types';
import { ObjectExecutorNode } from './object-executor.node';
import { TypeMapperNode } from './type-mapper.node';

@Injectable()
export class SchemaExecutorNode {
  private readonly logger = new Logger(SchemaExecutorNode.name);

  constructor(
    private readonly typeMapperNode: TypeMapperNode,
    private readonly objectExecutorNode: ObjectExecutorNode,
  ) {}

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(MESSAGE_TEMPLATES.SCHEMA_EXECUTION_STARTED);

      if (!state.schemaDesignResult || !state.schemaSpec) {
        return this.createErrorResult(ERROR_TEMPLATES.SCHEMA_SPEC_MISSING);
      }

      const schemaExecutionResult = await this.executeSchemaCreation(state);

      // Always return execution results, regardless of status
      // This ensures that successful operations are reported even when some objects fail
      if (schemaExecutionResult.status === EXECUTION_STATUS.FAILED) {
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
          return this.createSuccessResult(schemaExecutionResult, state);
        }
      }

      // For success and partial status, always return success result
      return this.createSuccessResult(schemaExecutionResult, state);
    } catch (error) {
      this.logger.error(ERROR_TEMPLATES.SCHEMA_EXECUTION_ERROR('Schema execution failed'), error);
      return this.createErrorResult(
        error instanceof Error
          ? error.message
          : ERROR_TEMPLATES.SCHEMA_EXECUTION_ERROR('Unknown error'),
      );
    }
  }

  private async executeSchemaCreation(state: ObjectStateType): Promise<SchemaExecutionResult> {
    const { schemaSpec, schemaDesignResult } = state;

    if (!schemaSpec || !schemaDesignResult) {
      throw new Error(ERROR_TEMPLATES.SCHEMA_SPEC_OR_DESIGN_MISSING);
    }

    const totalObjects = schemaSpec.objects.length;
    const completedObjects: ObjectExecutionResult[] = [];
    const failedObjects: Array<{ objectSpec: ObjectSpec; error: string }> = [];
    let processedObjects = 0;

    this.logger.log(MESSAGE_TEMPLATES.SCHEMA_EXECUTION_START(totalObjects));

    // Create objects based on the order determined during design phase
    for (const objectSpec of schemaSpec.objects) {
      try {
        this.logger.log(MESSAGE_TEMPLATES.PROCESSING_OBJECT(objectSpec.objectName));

        // Create a temporary state for this object
        const objectState: ObjectStateType = {
          ...state,
          objectSpec,
          currentObjectIndex: processedObjects,
          // Reset object-specific state
          dbDesignResult: null,
          typeMappingResult: null,
          executionResult: null,
          error: null,
        };

        // Find the corresponding design result for this object
        const objectDesignResult = schemaDesignResult.objects.find(
          (result) => result.nflowSchema && result.nflowSchema.objectName === objectSpec.objectName,
        );

        if (objectDesignResult) {
          objectState.dbDesignResult = objectDesignResult;
        }

        // Execute type mapping for this object
        const typeMappingState = await this.typeMapperNode.execute(objectState);

        if (typeMappingState.error) {
          throw new Error(typeMappingState.error);
        }

        // Execute object creation
        const updatedState = { ...objectState, ...typeMappingState };
        const executionState = await this.objectExecutorNode.execute(updatedState);

        // Always check for execution results, even if there's an error
        // This allows us to collect partial successes (e.g., object created but some fields failed)
        if (executionState.executionResult) {
          completedObjects.push(executionState.executionResult);
          this.logger.log(MESSAGE_TEMPLATES.OBJECT_CREATED_SUCCESS(objectSpec.objectName));
        }

        // If there's an error but we got some results, log it as a warning rather than throwing
        if (executionState.error) {
          if (executionState.executionResult) {
            this.logger.warn(
              `Object ${objectSpec.objectName} completed with partial success: ${executionState.error}`,
            );
          } else {
            throw new Error(executionState.error);
          }
        }

        processedObjects++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(MESSAGE_TEMPLATES.OBJECT_CREATION_FAILED(objectSpec.objectName), error);

        failedObjects.push({
          objectSpec,
          error: errorMessage,
        });

        processedObjects++;
      }
    }

    // Determine overall status
    let status: ExecutionStatus;
    if (failedObjects.length === 0) {
      status = EXECUTION_STATUS.SUCCESS;
    } else if (completedObjects.length > 0) {
      status = EXECUTION_STATUS.PARTIAL;
    } else {
      status = EXECUTION_STATUS.FAILED;
    }

    const result: SchemaExecutionResult = {
      schemaId: `schema_${Date.now()}`, // Generate a unique schema ID
      totalObjects,
      processedObjects,
      completedObjects,
      failedObjects,
      status,
      errors: failedObjects.length > 0 ? failedObjects.map((f) => f.error) : undefined,
    };

    this.logger.log(
      MESSAGE_TEMPLATES.SCHEMA_EXECUTION_SUMMARY(completedObjects.length, totalObjects),
    );

    return result;
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
    state: ObjectStateType,
  ): Partial<ObjectStateType> {
    return {
      schemaExecutionResult,
      isCompleted: true,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
      messages: [
        ...state.messages,
        new SystemMessage(`Schema execution completed: ${JSON.stringify(schemaExecutionResult)}`),
      ],
    };
  }
}
