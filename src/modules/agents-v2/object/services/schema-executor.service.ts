import { Injectable, Logger } from '@nestjs/common';

import {
  FIELD_ACTION_TYPES,
  OBJECT_ACCESS_LEVELS,
  RECORD_NAME_TYPES,
  RELATION_ATTRIBUTES,
} from '../constants/api-format.constants';
import {
  ERROR_TEMPLATES,
  EXECUTION_STATUS,
  EXECUTION_STEP_TYPES,
  MESSAGE_TEMPLATES,
  NFLOW_DATA_TYPES,
} from '../constants/object-graph.constants';
import { RelationshipProcessorService } from '../services/relationship-processor.service';
import type { ExecutionStep } from '../types/api-format.types';
import {
  DBDesignResult,
  ExecutionStatus,
  ObjectExecutionResult,
  ObjectSpec,
  ObjectStateType,
  SchemaDesignResult,
  SchemaExecutionResult,
} from '../types/object-graph-state.types';
import { FieldExecutorService } from './field-executor.service';
import { ObjectExecutorService } from './object-executor.service';

export interface SchemaExecutionOptions {
  userId: string;
  objectNameMapping?: Map<string, string>;
}

@Injectable()
export class SchemaExecutorService {
  private readonly logger = new Logger(SchemaExecutorService.name);

  constructor(
    private readonly objectExecutorService: ObjectExecutorService,
    private readonly fieldExecutorService: FieldExecutorService,
    private readonly relationshipProcessor: RelationshipProcessorService,
  ) {}

  /**
   * Get userId from chatSessionId
   */
  async getUserIdFromChatSession(chatSessionId: string): Promise<string> {
    return this.objectExecutorService.getUserIdFromChatSession(chatSessionId);
  }

  /**
   * Execute schema creation with objects and relationships
   */
  async executeSchema(
    schemaSpec: ObjectStateType['schemaSpec'],
    schemaDesignResult: SchemaDesignResult,
    options: SchemaExecutionOptions,
    state?: ObjectStateType,
  ): Promise<SchemaExecutionResult> {
    if (!schemaSpec || !schemaDesignResult) {
      throw new Error(ERROR_TEMPLATES.SCHEMA_SPEC_OR_DESIGN_MISSING);
    }

    const totalObjects = schemaSpec.objects.length;
    const completedObjects: ObjectExecutionResult[] = [];
    const failedObjects: Array<{ objectSpec: ObjectSpec; error: string }> = [];
    let processedObjects = 0;

    // Initialize global object name mapping for the entire schema
    const globalObjectNameMapping = new Map<string, string>(
      Object.entries(state?.objectNameMapping || {}),
    );

    // Add any existing created objects to the mapping
    if (state?.createdObjects) {
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

        // Create object-only spec by filtering out relation fields
        const objectOnlySpec = this.createObjectOnlySpec(objectSpec);

        // Find the corresponding design result for this object
        const objectDesignResult = schemaDesignResult.objects.find(
          (result) => result.nflowSchema && result.nflowSchema.objectName === objectSpec.objectName,
        );

        if (objectDesignResult) {
          // Also filter relation fields from design result
          const filteredDesignResult =
            this.filterRelationFieldsFromDesignResult(objectDesignResult);

          // Execute object creation using the service
          const executionResult = await this.executeObjectWithService(
            objectOnlySpec,
            filteredDesignResult,
            {
              ...options,
              objectNameMapping: globalObjectNameMapping,
            },
            state,
          );

          if (executionResult) {
            completedObjects.push(executionResult);

            // Update global object name mapping with newly created object
            if (executionResult.createdEntities?.objectNameMapping) {
              for (const [originalName, uniqueName] of Object.entries(
                executionResult.createdEntities.objectNameMapping,
              )) {
                globalObjectNameMapping.set(originalName, uniqueName);
              }
            }

            this.logger.log(MESSAGE_TEMPLATES.OBJECT_CREATED_SUCCESS(objectSpec.objectName));
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
      options,
      globalObjectNameMapping,
      state,
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
   * Execute object creation using the ObjectExecutorService
   */
  private async executeObjectWithService(
    objectSpec: ObjectSpec,
    designResult: DBDesignResult,
    options: SchemaExecutionOptions & { objectNameMapping: Map<string, string> },
    state?: ObjectStateType,
  ): Promise<ObjectExecutionResult | null> {
    try {
      // Convert ObjectSpec and DBDesignResult to API format
      const apiFormat = this.convertToApiFormat(objectSpec, designResult);

      if (!apiFormat.objectFormat) {
        throw new Error('Failed to convert object spec to API format');
      }

      // Use ObjectExecutorService to create the object with its fields
      const serviceOptions = {
        userId: options.userId,
        objectNameMapping: options.objectNameMapping,
        state,
      };

      const result = await this.objectExecutorService.executeObjectWithFields(
        apiFormat.objectFormat as Parameters<
          typeof this.objectExecutorService.executeObjectWithFields
        >[0],
        (apiFormat.fieldsFormat || []) as Parameters<
          typeof this.objectExecutorService.executeObjectWithFields
        >[1],
        serviceOptions,
      );

      if (!result.success) {
        throw new Error(result.errors?.join(', ') || 'Object creation failed');
      }

      // Convert service result to ObjectExecutionResult format
      return {
        status: result.success ? 'success' : 'failed',
        objectId: result.objectId,
        fieldIds: result.fieldIds || [],
        createdEntities: result.createdEntities || {},
        errors: result.errors,
        completedSteps: result.completedSteps as ExecutionStep[],
      };
    } catch (error) {
      this.logger.error(`Failed to execute object ${objectSpec.objectName}`, error);
      return null;
    }
  }

  /**
   * Convert ObjectSpec and DBDesignResult to API format
   */
  private convertToApiFormat(
    objectSpec: ObjectSpec,
    designResult: DBDesignResult,
  ): {
    objectFormat?: any;
    fieldsFormat?: any[];
  } {
    // This is a simplified conversion - in a real implementation,
    // you would need to properly convert the design result to API format
    // For now, we'll create a basic structure
    const objectFormat = {
      action: FIELD_ACTION_TYPES.CREATE,
      data: {
        name: objectSpec.objectName,
        displayName: designResult.nflowSchema?.displayName || objectSpec.objectName,
        description: objectSpec.description,
        recordName: {
          label: 'Name',
          type: RECORD_NAME_TYPES.TEXT,
        },
        owd: OBJECT_ACCESS_LEVELS.PUBLIC_READ,
      },
    };

    const fieldsFormat =
      designResult.nflowSchema?.fields?.map((field) => ({
        objName: objectSpec.objectName,
        action: 'create' as const,
        data: {
          name: field.name,
          displayName: field.displayName,
          typeName: field.typeName,
          description: field.description,
          value: field.targetObject, // For relation fields
          attributes:
            field.typeName === 'relation'
              ? {
                  subType: 'lookup',
                  onDelete: 'noAction' as const,
                }
              : undefined,
        },
      })) || [];

    return {
      objectFormat,
      fieldsFormat,
    };
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
    options: SchemaExecutionOptions,
    globalObjectNameMapping: Map<string, string>,
    state?: ObjectStateType,
  ): Promise<{
    successful: ObjectExecutionResult[];
    failed: Array<{ objectSpec: ObjectSpec; error: string }>;
  }> {
    const successful: ObjectExecutionResult[] = [];
    const failed: Array<{ objectSpec: ObjectSpec; error: string }> = [];

    this.logger.log('Phase 2: Creating relation fields');

    // Check if there are relationships to process from the original schema spec
    if (
      !state?.schemaSpec?.globalRelationships ||
      state.schemaSpec.globalRelationships.length === 0
    ) {
      this.logger.log('No relationships defined in schema, skipping relation fields creation');
      return { successful, failed };
    }

    // Re-process relationships with the actual object name mappings
    const mockSchema = {
      schemaName: state.schemaSpec.schemaName,
      description: state.schemaSpec.description,
      objects: objectSpecs.map((spec) => ({
        objectName: spec.objectName,
        displayName: spec.objectName,
        description: spec.description,
        fields: [],
        priority: 1,
        dependencies: [],
      })),
      relationships: state.schemaSpec.globalRelationships.map((rel) => ({
        fromObject: rel.fromObject,
        toObject: rel.toObject,
        relationshipType: rel.type,
        description: rel.description,
      })),
      creationOrder: objectSpecs.map((spec) => spec.objectName),
    };

    // Process relationships with object name mappings
    const relationshipResult = this.relationshipProcessor.processRelationships(
      mockSchema,
      globalObjectNameMapping,
    );

    if (!relationshipResult.success) {
      this.logger.error(
        'Failed to process relationships with object mappings',
        relationshipResult.errors,
      );
      // Add all objects as failed due to relationship processing failure
      for (const objectSpec of objectSpecs) {
        failed.push({
          objectSpec,
          error: `Relationship processing failed: ${relationshipResult.errors.join(', ')}`,
        });
      }
      return { successful, failed };
    }

    // Execute relation fields for each object that has generated relation fields
    for (const processedObject of relationshipResult.processedObjects) {
      if (processedObject.fields.length === 0) continue;

      const originalObjectSpec = objectSpecs.find(
        (spec) => spec.objectName === processedObject.objectName,
      );
      if (!originalObjectSpec) {
        failed.push({
          objectSpec: {
            objectName: processedObject.objectName,
            description: processedObject.description,
            fields: [],
          },
          error: `Original object spec not found for ${processedObject.objectName}`,
        });
        continue;
      }

      try {
        this.logger.log(
          MESSAGE_TEMPLATES.PROCESSING_OBJECT(processedObject.objectName) + ' (relations phase)',
        );

        // Convert relation fields to API format
        const relationFieldsFormat = processedObject.fields.map((field) => ({
          objName: processedObject.objectName,
          action: FIELD_ACTION_TYPES.CREATE,
          data: {
            name: field.name,
            displayName: field.displayName,
            typeName: field.typeName as 'relation',
            description: field.description,
            value: field.targetObject,
            attributes: {
              subType: RELATION_ATTRIBUTES.SUB_TYPES.LOOKUP,
              onDelete: RELATION_ATTRIBUTES.ON_DELETE_ACTIONS.NO_ACTION,
            },
          },
        }));

        // Execute relation fields using FieldExecutorService
        const fieldOptions = {
          userId: options.userId,
          objectNameMapping: globalObjectNameMapping,
          state,
        };

        const fieldsResult = await this.fieldExecutorService.executeFields(
          relationFieldsFormat as unknown as Parameters<
            typeof this.fieldExecutorService.executeFields
          >[0],
          'create',
          fieldOptions,
        );

        if (fieldsResult.hasSuccessfulOperations) {
          // Create a mock execution result for successful relation fields
          const executionResult: ObjectExecutionResult = {
            status: fieldsResult.hasFailedOperations ? 'partial' : 'success',
            objectId: processedObject.objectName,
            fieldIds: fieldsResult.successful.map((f) => f.fieldId),
            createdEntities: {
              fields: fieldsResult.successful.map((f) => f.fieldId),
              fieldsDetailed: JSON.stringify(
                fieldsResult.successful.map((field, index) => ({
                  name: relationFieldsFormat[index].data.name,
                  displayName: relationFieldsFormat[index].data.displayName,
                  typeName: relationFieldsFormat[index].data.typeName,
                  description: relationFieldsFormat[index].data.description,
                })),
              ),
            },
            errors: fieldsResult.failed.map((f) => f.error),
            completedSteps: fieldsResult.successful.map((field, index) => ({
              type: EXECUTION_STEP_TYPES.CREATE_FIELD,
              stepIndex: index,
              entityId: field.fieldId,
              entityName: field.fieldName,
            })),
          };

          successful.push(executionResult);
          this.logger.log(
            `Successfully created relation fields for object: ${processedObject.objectName}`,
          );
        }

        if (fieldsResult.hasFailedOperations && !fieldsResult.hasSuccessfulOperations) {
          throw new Error(fieldsResult.failed.map((f) => f.error).join(', '));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to create relation fields for object ${processedObject.objectName}:`,
          error,
        );

        failed.push({
          objectSpec: originalObjectSpec,
          error: `Relation fields creation failed: ${errorMessage}`,
        });
      }
    }

    return { successful, failed };
  }
}
