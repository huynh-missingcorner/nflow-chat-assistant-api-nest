import { Injectable, Logger } from '@nestjs/common';

import {
  ERROR_TEMPLATES,
  EXECUTION_STATUS,
  MESSAGE_TEMPLATES,
  NFLOW_DATA_TYPES,
  OBJECT_GRAPH_NODES,
} from '../constants/object-graph.constants';
import {
  DBDesignResult,
  ExecutionStatus,
  ObjectExecutionResult,
  ObjectSpec,
  ObjectStateType,
  SchemaDesignResult,
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

  private async executeSchemaCreation(state: ObjectStateType): Promise<SchemaExecutionResult> {
    const { schemaSpec, schemaDesignResult } = state;

    if (!schemaSpec || !schemaDesignResult) {
      throw new Error(ERROR_TEMPLATES.SCHEMA_SPEC_OR_DESIGN_MISSING);
    }

    const totalObjects = schemaSpec.objects.length;
    const completedObjects: ObjectExecutionResult[] = [];
    const failedObjects: Array<{ objectSpec: ObjectSpec; error: string }> = [];
    let processedObjects = 0;

    // Initialize global object name mapping for the entire schema
    const globalObjectNameMapping = new Map<string, string>(
      Object.entries(state.objectNameMapping || {}),
    );

    // Add any existing created objects to the mapping
    if (state.createdObjects) {
      for (const createdObj of state.createdObjects) {
        globalObjectNameMapping.set(createdObj.originalName, createdObj.uniqueName);
      }
    }

    this.logger.log(MESSAGE_TEMPLATES.SCHEMA_EXECUTION_START(totalObjects));

    // Phase 1: Create all objects first (without relation fields)
    for (const objectSpec of schemaSpec.objects) {
      try {
        this.logger.log(
          MESSAGE_TEMPLATES.PROCESSING_OBJECT(objectSpec.objectName) + ' (objects phase)',
        );

        // Create object-only state by filtering out relation fields
        const objectOnlySpec = this.createObjectOnlySpec(objectSpec);

        // Create a temporary state for this object
        const objectState: ObjectStateType = {
          ...state,
          objectSpec: objectOnlySpec,
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
          // Also filter relation fields from design result
          const filteredDesignResult =
            this.filterRelationFieldsFromDesignResult(objectDesignResult);
          objectState.dbDesignResult = filteredDesignResult;
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
        if (executionState.executionResult) {
          completedObjects.push(executionState.executionResult);

          // Update global object name mapping with newly created object
          if (executionState.executionResult.createdEntities?.objectNameMapping) {
            for (const [originalName, uniqueName] of Object.entries(
              executionState.executionResult.createdEntities.objectNameMapping,
            )) {
              globalObjectNameMapping.set(originalName, uniqueName);
            }
          }

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

    // Phase 2: Create relation fields now that all objects exist
    const relationExecutionResults = await this.executeRelationFields(
      schemaSpec.objects,
      schemaDesignResult,
      state,
      globalObjectNameMapping,
    );

    // Merge relation execution results with object execution results
    completedObjects.push(...relationExecutionResults.successful);
    failedObjects.push(...relationExecutionResults.failed);

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

  /**
   * Create a new ObjectSpec with only non-relation fields
   */
  private createObjectOnlySpec(objectSpec: ObjectSpec): ObjectSpec {
    if (!objectSpec.fields) {
      return objectSpec;
    }

    return {
      ...objectSpec,
      fields: objectSpec.fields.filter((field) => field.typeHint !== 'relation'),
    };
  }

  /**
   * Filter relation fields from DB design result
   */
  private filterRelationFieldsFromDesignResult(designResult: DBDesignResult): DBDesignResult {
    if (!designResult?.nflowSchema?.fields) {
      return designResult;
    }

    return {
      ...designResult,
      nflowSchema: {
        ...designResult.nflowSchema,
        fields: designResult.nflowSchema.fields.filter(
          (field) => field.typeName !== NFLOW_DATA_TYPES.RELATION,
        ),
      },
    };
  }

  /**
   * Execute relation fields after all objects are created
   */
  private async executeRelationFields(
    objectSpecs: ObjectSpec[],
    schemaDesignResult: SchemaDesignResult,
    originalState: ObjectStateType,
    globalObjectNameMapping: Map<string, string>,
  ): Promise<{
    successful: ObjectExecutionResult[];
    failed: Array<{ objectSpec: ObjectSpec; error: string }>;
  }> {
    const successful: ObjectExecutionResult[] = [];
    const failed: Array<{ objectSpec: ObjectSpec; error: string }> = [];

    this.logger.log('Phase 2: Creating relation fields');

    for (const objectSpec of objectSpecs) {
      if (!objectSpec.fields) continue;

      // Filter to only relation fields
      const relationFields = objectSpec.fields.filter((field) => field.typeHint === 'relation');

      if (relationFields.length === 0) continue;

      try {
        this.logger.log(
          MESSAGE_TEMPLATES.PROCESSING_OBJECT(objectSpec.objectName) + ' (relations phase)',
        );

        // Create relation-only spec
        const relationOnlySpec: ObjectSpec = {
          ...objectSpec,
          fields: relationFields,
        };

        // Create a temporary state for relation fields
        const relationState: ObjectStateType = {
          ...originalState,
          objectSpec: relationOnlySpec,
          // Reset object-specific state
          dbDesignResult: null,
          typeMappingResult: null,
          executionResult: null,
          error: null,
          // Pass the global object name mapping
          objectNameMapping: Object.fromEntries(globalObjectNameMapping),
        };

        // Find and filter design result to only relation fields
        const objectDesignResult = schemaDesignResult.objects.find(
          (result) => result.nflowSchema?.objectName === objectSpec.objectName,
        );

        if (objectDesignResult?.nflowSchema?.fields) {
          const relationDesignResult: DBDesignResult = {
            ...objectDesignResult,
            nflowSchema: {
              ...objectDesignResult.nflowSchema,
              fields: objectDesignResult.nflowSchema.fields.filter(
                (field) => field.typeName === NFLOW_DATA_TYPES.RELATION,
              ),
            },
          };
          relationState.dbDesignResult = relationDesignResult;
        }

        // Execute type mapping for relation fields
        const typeMappingState = await this.typeMapperNode.execute(relationState);

        if (typeMappingState.error) {
          throw new Error(typeMappingState.error);
        }

        // Execute relation field creation with object name mapping support
        const updatedState = { ...relationState, ...typeMappingState };
        const executionState = await this.objectExecutorNode.execute(updatedState);

        if (executionState.executionResult) {
          successful.push(executionState.executionResult);
          this.logger.log(
            `Successfully created relation fields for object: ${objectSpec.objectName}`,
          );
        }

        if (executionState.error && !executionState.executionResult) {
          throw new Error(executionState.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to create relation fields for object ${objectSpec.objectName}:`,
          error,
        );

        failed.push({
          objectSpec,
          error: `Relation fields creation failed: ${errorMessage}`,
        });
      }
    }

    return { successful, failed };
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
