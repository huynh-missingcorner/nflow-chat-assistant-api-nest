import { Injectable, Logger } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { ObjectDto } from '@/modules/nflow/types';
import { generateUniqueObjectName } from '@/shared/utils';

import type { ApiFieldsFormat, ApiObjectFormat } from '../types/api-format.types';
import { ObjectStateType } from '../types/object-graph-state.types';
import { type BatchFieldExecutionResult, FieldExecutorService } from './field-executor.service';

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

export interface BatchObjectExecutionResult {
  successful: Array<{ objectId: string; objectName: string; originalName: string }>;
  failed: Array<{ objectName: string; error: string }>;
  hasSuccessfulOperations: boolean;
  hasFailedOperations: boolean;
  objectNameMapping: Map<string, string>;
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
      this.logger.debug(`Executing object creation for: ${objectData.data.name}`);

      const uniqueName = this.generateAndStoreUniqueName(objectData.data.name, options);
      const objectDto = this.buildObjectDto(objectData, uniqueName);
      const result = await this.nflowObjectService.changeObject(objectDto, options.userId);

      this.logger.log(`Object created successfully: ${result.name}`);
      return {
        success: true,
        objectId: result.name,
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
    const result = this.initializeExecutionResult();
    let stepIndex = 0;

    try {
      const objectResult = await this.createObject(objectData, options, result, stepIndex++);
      if (!objectResult.success) {
        return result;
      }

      if (this.hasFieldsToCreate(fieldsData)) {
        await this.createFields(
          fieldsData,
          objectData,
          options,
          result,
          stepIndex,
          objectResult.objectId!,
        );
      } else {
        result.success = true;
      }

      return result;
    } catch (error) {
      this.logger.error('Error during object with fields execution', error);
      this.handleExecutionError(error, result);
      return result;
    }
  }

  /**
   * Execute multiple objects creation
   */
  async executeObjects(
    objectsData: ApiObjectFormat[],
    options: ObjectExecutionOptions,
  ): Promise<BatchObjectExecutionResult> {
    const result = this.initializeBatchResult(options);

    for (const objectData of objectsData) {
      await this.processObjectInBatch(objectData, result, options);
    }

    return result;
  }

  private generateAndStoreUniqueName(
    originalName: string,
    options: ObjectExecutionOptions,
  ): string {
    const objectNameMapping = options.objectNameMapping || new Map<string, string>();
    const uniqueName = generateUniqueObjectName(originalName);
    objectNameMapping.set(originalName, uniqueName);
    return uniqueName;
  }

  private buildObjectDto(objectData: ApiObjectFormat, uniqueName: string): ObjectDto {
    return {
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
  }

  private initializeExecutionResult(): ObjectWithFieldsExecutionResult {
    return {
      success: false,
      fieldIds: [],
      errors: [],
      createdEntities: {},
      completedSteps: [],
    };
  }

  private async createObject(
    objectData: ApiObjectFormat,
    options: ObjectExecutionOptions,
    result: ObjectWithFieldsExecutionResult,
    stepIndex: number,
  ): Promise<{ success: boolean; objectId?: string }> {
    this.logger.log(`Creating object: ${objectData.data.name}`);

    const objectResult = await this.executeObject(objectData, options);

    if (!objectResult.success) {
      result.errors?.push(`Object creation failed: ${objectResult.error || 'Unknown error'}`);
      return { success: false };
    }

    this.updateResultWithObjectSuccess(result, objectResult, objectData, stepIndex);
    return { success: true, objectId: objectResult.objectId };
  }

  private updateResultWithObjectSuccess(
    result: ObjectWithFieldsExecutionResult,
    objectResult: ObjectExecutionResult,
    objectData: ApiObjectFormat,
    stepIndex: number,
  ): void {
    result.objectId = objectResult.objectId;
    result.completedSteps?.push({
      type: 'create_object',
      stepIndex,
      entityId: objectResult.objectId || 'Unknown',
      entityName: objectResult.objectId,
    });

    result.createdEntities = {
      object: objectResult.objectId || 'Unknown',
      objectDisplayName: objectData.data.displayName,
      objectDescription: objectData.data.description || undefined,
      objectNameMapping: { [objectData.data.name]: objectResult.objectId || '' },
    };
  }

  private hasFieldsToCreate(fieldsData: ApiFieldsFormat): boolean {
    return fieldsData && fieldsData.length > 0;
  }

  private async createFields(
    fieldsData: ApiFieldsFormat,
    objectData: ApiObjectFormat,
    options: ObjectExecutionOptions,
    result: ObjectWithFieldsExecutionResult,
    stepIndex: number,
    objectId: string,
  ): Promise<void> {
    this.logger.log(`Creating ${fieldsData.length} fields for object: ${objectData.data.name}`);

    const fieldOptions = this.buildFieldExecutionOptions(options, objectData.data.name, objectId);
    const fieldsResult = await this.fieldExecutorService.executeFields(
      fieldsData,
      'create',
      fieldOptions,
    );

    this.updateResultWithFieldResults(result, fieldsResult, fieldsData, stepIndex);
  }

  private buildFieldExecutionOptions(
    options: ObjectExecutionOptions,
    originalObjectName: string,
    objectId: string,
  ) {
    const updatedObjectNameMapping = new Map(options.objectNameMapping || []);
    updatedObjectNameMapping.set(originalObjectName, objectId);

    return {
      ...options,
      objectNameMapping: updatedObjectNameMapping,
    };
  }

  private updateResultWithFieldResults(
    result: ObjectWithFieldsExecutionResult,
    fieldsResult: BatchFieldExecutionResult,
    fieldsData: ApiFieldsFormat,
    stepIndex: number,
  ): void {
    result.fieldIds = fieldsResult.successful.map((f) => f.fieldId);

    if (fieldsResult.failed.length > 0) {
      const fieldErrors = fieldsResult.failed.map((f) => `Field ${f.fieldName}: ${f.error}`);
      result.errors?.push(...fieldErrors);
    }

    this.addFieldCompletedSteps(result, fieldsResult, stepIndex);
    this.addFieldDetailedInfo(result, fieldsResult, fieldsData);

    result.success = this.determineFieldExecutionSuccess(fieldsResult);
  }

  private addFieldCompletedSteps(
    result: ObjectWithFieldsExecutionResult,
    fieldsResult: BatchFieldExecutionResult,
    stepIndex: number,
  ): void {
    fieldsResult.successful.forEach((field, index) => {
      result.completedSteps?.push({
        type: 'create_field',
        stepIndex: stepIndex + index,
        entityId: field.fieldId,
        entityName: field.fieldName,
      });
    });
  }

  private addFieldDetailedInfo(
    result: ObjectWithFieldsExecutionResult,
    fieldsResult: BatchFieldExecutionResult,
    fieldsData: ApiFieldsFormat,
  ): void {
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

      result.createdEntities!.fieldsDetailed = JSON.stringify(fieldInfos);
      result.createdEntities!.fields = fieldsResult.successful.map((f) => f.fieldId);
    }
  }

  private determineFieldExecutionSuccess(fieldsResult: BatchFieldExecutionResult): boolean {
    return !(fieldsResult.hasFailedOperations && !fieldsResult.hasSuccessfulOperations);
  }

  private handleExecutionError(error: unknown, result: ObjectWithFieldsExecutionResult): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Object with fields execution failed';
    result.errors?.push(errorMessage);
    result.success = false;
  }

  private initializeBatchResult(options: ObjectExecutionOptions): BatchObjectExecutionResult {
    return {
      successful: [],
      failed: [],
      hasSuccessfulOperations: false,
      hasFailedOperations: false,
      objectNameMapping: new Map(options.objectNameMapping || []),
    };
  }

  private async processObjectInBatch(
    objectData: ApiObjectFormat,
    result: BatchObjectExecutionResult,
    options: ObjectExecutionOptions,
  ): Promise<void> {
    const objectResult = await this.executeObject(objectData, {
      ...options,
      objectNameMapping: result.objectNameMapping,
    });

    if (objectResult.success && objectResult.objectId) {
      result.successful.push({
        objectId: objectResult.objectId,
        objectName: objectResult.objectId,
        originalName: objectData.data.name,
      });
      result.objectNameMapping.set(objectData.data.name, objectResult.objectId);
    } else {
      result.failed.push({
        objectName: objectData.data.name,
        error: objectResult.error || 'Unknown error',
      });
    }

    result.hasSuccessfulOperations = result.successful.length > 0;
    result.hasFailedOperations = result.failed.length > 0;
  }
}
