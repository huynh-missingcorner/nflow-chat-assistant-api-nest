import { Injectable, Logger } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { ObjectDto } from '@/modules/nflow/types';
import { generateUniqueObjectName } from '@/shared/utils';

import type { ApiFieldsFormat, ApiObjectFormat } from '../types/api-format.types';
import { ObjectStateType } from '../types/object-graph-state.types';
import { FieldExecutorService } from './field-executor.service';

export interface ObjectExecutionOptions {
  userId: string;
  objectNameMapping?: Map<string, string>;
  state?: ObjectStateType;
}

export interface ObjectExecutionResult {
  success: boolean;
  objectId?: string;
  error?: string;
}

export interface ObjectWithFieldsExecutionResult {
  success: boolean;
  objectId?: string;
  fieldIds?: string[];
  errors?: string[];
  createdEntities?: Record<string, any>;
  completedSteps?: Array<{
    type: string;
    stepIndex: number;
    entityId: string;
    entityName?: string;
  }>;
}

@Injectable()
export class ObjectExecutorService {
  private readonly logger = new Logger(ObjectExecutorService.name);

  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly nflowObjectService: NFlowObjectService,
    private readonly fieldExecutorService: FieldExecutorService,
  ) {}

  /**
   * Get userId from chatSessionId
   */
  async getUserIdFromChatSession(chatSessionId: string): Promise<string> {
    return this.chatSessionService.getUserIdFromChatSession(chatSessionId);
  }

  /**
   * Execute object creation
   */
  async executeObject(
    objectData: ApiObjectFormat,
    options: ObjectExecutionOptions,
  ): Promise<ObjectExecutionResult> {
    try {
      this.logger.debug(
        `Executing object creation for: ${objectData.data.name}`,
        JSON.stringify(objectData, null, 2),
      );

      // Initialize object name mapping
      const objectNameMapping = options.objectNameMapping || new Map<string, string>();

      // Generate unique name to ensure uniqueness in the NFlow platform
      const uniqueName = generateUniqueObjectName(objectData.data.name);

      // Store the mapping between original name and unique name
      objectNameMapping.set(objectData.data.name, uniqueName);

      const objectDto: ObjectDto = {
        data: {
          displayName: objectData.data.displayName,
          recordName: {
            label: objectData.data.recordName.label,
            type: objectData.data.recordName.type,
          },
          owd: objectData.data.owd || 'PublicRead',
          name: uniqueName,
          description: objectData.data.description || undefined,
        },
        action: objectData.action,
        name: uniqueName,
      };

      const result = await this.nflowObjectService.changeObject(objectDto, options.userId);

      this.logger.log(`Object created successfully: ${result.name}`);
      return {
        success: true,
        objectId: result.name, // Using name as objectId since that's what the API returns
      };
    } catch (error) {
      this.logger.error('Failed to create object via API', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Object creation failed',
      };
    }
  }

  /**
   * Execute object creation with its fields
   */
  async executeObjectWithFields(
    objectData: ApiObjectFormat,
    fieldsData: ApiFieldsFormat,
    options: ObjectExecutionOptions,
  ): Promise<ObjectWithFieldsExecutionResult> {
    const result: ObjectWithFieldsExecutionResult = {
      success: false,
      fieldIds: [],
      errors: [],
      createdEntities: {},
      completedSteps: [],
    };

    let stepIndex = 0;

    try {
      // Step 1: Create the object first
      this.logger.log(`Creating object: ${objectData.data.name}`);
      const objectResult = await this.executeObject(objectData, options);

      if (!objectResult.success) {
        result.errors?.push(`Object creation failed: ${objectResult.error || 'Unknown error'}`);
        return result;
      }

      // Track object creation success
      result.objectId = objectResult.objectId;
      result.completedSteps?.push({
        type: 'create_object',
        stepIndex: stepIndex++,
        entityId: objectResult.objectId || 'Unknown',
        entityName: objectResult.objectId,
      });

      // Store object information in createdEntities
      result.createdEntities = {
        object: objectResult.objectId || 'Unknown',
        objectDisplayName: objectData.data.displayName,
        objectDescription: objectData.data.description || undefined,
        objectNameMapping: { [objectData.data.name]: objectResult.objectId || '' },
      };

      // Update object name mapping for field creation
      const updatedObjectNameMapping = new Map(options.objectNameMapping || []);
      updatedObjectNameMapping.set(objectData.data.name, objectResult.objectId || '');

      // Step 2: Create fields if any
      if (fieldsData && fieldsData.length > 0) {
        this.logger.log(`Creating ${fieldsData.length} fields for object: ${objectData.data.name}`);

        const fieldOptions = {
          ...options,
          objectNameMapping: updatedObjectNameMapping,
        };

        const fieldsResult = await this.fieldExecutorService.executeFields(
          fieldsData,
          'create',
          fieldOptions,
        );

        // Collect field results
        result.fieldIds = fieldsResult.successful.map((f) => f.fieldId);

        // Add field errors to overall errors
        if (fieldsResult.failed.length > 0) {
          const fieldErrors = fieldsResult.failed.map((f) => `Field ${f.fieldName}: ${f.error}`);
          result.errors?.push(...fieldErrors);
        }

        // Track completed field steps
        fieldsResult.successful.forEach((field) => {
          result.completedSteps?.push({
            type: 'create_field',
            stepIndex: stepIndex++,
            entityId: field.fieldId,
            entityName: field.fieldName,
          });
        });

        // Store detailed field information
        if (fieldsResult.successful.length > 0) {
          const fieldInfos = fieldsResult.successful.map((field, index) => {
            const fieldData = fieldsData[index];
            return {
              name: fieldData.data.name,
              displayName: fieldData.data.displayName,
              typeName: fieldData.data.typeName,
              description: fieldData.data.description || undefined,
            };
          });

          result.createdEntities.fieldsDetailed = JSON.stringify(fieldInfos);
          result.createdEntities.fields = fieldsResult.successful.map((f) => f.fieldId);
        }

        // Determine success based on field results
        if (fieldsResult.hasFailedOperations && !fieldsResult.hasSuccessfulOperations) {
          // All fields failed, but object was created
          result.success = false; // Partial failure
        } else {
          result.success = true; // Object created, some or all fields succeeded
        }
      } else {
        // No fields to create, object creation was successful
        result.success = true;
      }

      return result;
    } catch (error) {
      this.logger.error('Error during object with fields execution', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Object with fields execution failed';
      result.errors?.push(errorMessage);
      result.success = false;
      return result;
    }
  }

  /**
   * Execute multiple objects creation
   */
  async executeObjects(
    objectsData: ApiObjectFormat[],
    options: ObjectExecutionOptions,
  ): Promise<{
    successful: Array<{ objectId: string; objectName: string; originalName: string }>;
    failed: Array<{ objectName: string; error: string }>;
    hasSuccessfulOperations: boolean;
    hasFailedOperations: boolean;
    objectNameMapping: Map<string, string>;
  }> {
    const successful: Array<{ objectId: string; objectName: string; originalName: string }> = [];
    const failed: Array<{ objectName: string; error: string }> = [];
    const objectNameMapping = new Map(options.objectNameMapping || []);

    for (const objectData of objectsData) {
      const result = await this.executeObject(objectData, {
        ...options,
        objectNameMapping,
      });

      if (result.success && result.objectId) {
        successful.push({
          objectId: result.objectId,
          objectName: result.objectId,
          originalName: objectData.data.name,
        });
        // Update mapping for subsequent objects
        objectNameMapping.set(objectData.data.name, result.objectId);
      } else {
        failed.push({
          objectName: objectData.data.name,
          error: result.error || 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      hasSuccessfulOperations: successful.length > 0,
      hasFailedOperations: failed.length > 0,
      objectNameMapping,
    };
  }
}
