import { Injectable, Logger } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { FieldDto } from '@/modules/nflow/types';

import type {
  ApiFieldFormat,
  ApiFieldsFormat,
  FieldActionType,
  RelationOnDeleteAction,
} from '../types/api-format.types';
import { ObjectStateType } from '../types/object-graph-state.types';

export interface FieldExecutionOptions {
  userId: string;
  objectNameMapping?: Map<string, string>;
  state?: ObjectStateType;
}

export interface FieldExecutionResult {
  success: boolean;
  fieldId?: string;
  fieldName?: string;
  error?: string;
}

export interface BatchFieldExecutionResult {
  successful: Array<{ fieldId: string; fieldName: string }>;
  failed: Array<{ fieldName: string; error: string }>;
  hasSuccessfulOperations: boolean;
  hasFailedOperations: boolean;
}

@Injectable()
export class FieldExecutorService {
  private readonly logger = new Logger(FieldExecutorService.name);

  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly nflowObjectService: NFlowObjectService,
  ) {}

  /**
   * Get userId from chatSessionId
   */
  async getUserIdFromChatSession(chatSessionId: string): Promise<string> {
    return this.chatSessionService.getUserIdFromChatSession(chatSessionId);
  }

  /**
   * Execute field creation/update/delete operation
   */
  async executeField(
    fieldData: ApiFieldFormat,
    action: FieldActionType,
    options: FieldExecutionOptions,
  ): Promise<FieldExecutionResult> {
    try {
      this.logger.debug(`Executing ${action} field operation for: ${fieldData.data.name}`);

      if (action === 'delete') {
        return this.executeFieldDeletion(fieldData, options.userId);
      }

      const objectNameMapping = this.buildObjectNameMapping(options);
      const mappedObjectName = this.resolveObjectName(fieldData.objName, objectNameMapping);
      const mappedFieldValue = this.resolveFieldValue(fieldData, objectNameMapping);
      const pickListId = this.resolvePickListId(fieldData, options.state);

      this.validateFieldData(fieldData, pickListId);

      const fieldDto = this.buildFieldDto(
        fieldData,
        action,
        mappedObjectName,
        mappedFieldValue,
        pickListId,
      );

      const result = await this.nflowObjectService.changeField(fieldDto, options.userId);

      this.logger.log(`Field ${action} completed successfully: ${result.name}`);
      return {
        success: true,
        fieldId: result.name,
        fieldName: fieldData.data.name,
      };
    } catch (error) {
      this.logger.error(`Failed to ${action} field via API`, error);
      return {
        success: false,
        fieldName: fieldData.data.name,
        error: error instanceof Error ? error.message : `Field ${action} failed`,
      };
    }
  }

  /**
   * Execute multiple field operations in sequence
   */
  async executeFields(
    fieldsData: ApiFieldsFormat,
    action: FieldActionType,
    options: FieldExecutionOptions,
  ): Promise<BatchFieldExecutionResult> {
    const results = await Promise.allSettled(
      fieldsData.map((fieldData) => this.executeField(fieldData, action, options)),
    );

    return this.processBatchResults(results);
  }

  private buildObjectNameMapping(options: FieldExecutionOptions): Map<string, string> {
    const mapping = new Map(options.objectNameMapping || []);

    if (options.state?.objectNameMapping) {
      Object.entries(options.state.objectNameMapping).forEach(([original, unique]) => {
        mapping.set(original, unique);
      });
    }

    if (options.state?.createdObjects) {
      options.state.createdObjects.forEach((obj) => {
        mapping.set(obj.originalName, obj.uniqueName);
      });
    }

    return mapping;
  }

  private resolveObjectName(originalName: string, mapping: Map<string, string>): string {
    return mapping.get(originalName) || originalName;
  }

  private resolveFieldValue(
    fieldData: ApiFieldFormat,
    mapping: Map<string, string>,
  ): string | undefined {
    const { typeName, value } = fieldData.data;

    if (typeName !== 'relation' || !value) {
      return value || undefined;
    }

    const mappedValue = mapping.get(value);
    if (mappedValue) {
      this.logger.debug(`Mapped relation target from '${value}' to '${mappedValue}'`);
      return mappedValue;
    }

    this.logger.warn(`No mapping found for relation target object '${value}', using original name`);
    return value;
  }

  private resolvePickListId(
    fieldData: ApiFieldFormat,
    state?: ObjectStateType,
  ): string | undefined {
    if (fieldData.data.typeName !== 'pickList') {
      return fieldData.data.pickListId ?? undefined;
    }

    const createdPickListId = state?.fieldSpec?.pickListInfo?.createdPickListId;
    if (createdPickListId) {
      this.logger.debug(
        `Using created pickListId: ${createdPickListId} for field: ${fieldData.data.name}`,
      );
      return createdPickListId;
    }

    return fieldData.data.pickListId ?? undefined;
  }

  private validateFieldData(fieldData: ApiFieldFormat, pickListId?: string): void {
    if (fieldData.data.typeName === 'pickList' && !pickListId) {
      this.logger.warn(
        `PickList field ${fieldData.data.name} is missing pickListId - this may cause API errors`,
      );
    }
  }

  private buildFieldDto(
    fieldData: ApiFieldFormat,
    action: FieldActionType,
    objectName: string,
    fieldValue: string | undefined,
    pickListId: string | undefined,
  ): FieldDto {
    const attributes = this.buildFieldAttributes(fieldData);

    return {
      objName: objectName,
      action,
      data: {
        typeName: fieldData.data.typeName,
        name: fieldData.data.name,
        displayName: fieldData.data.displayName,
        value: fieldValue,
        description: fieldData.data.description || undefined,
        pickListId: pickListId || undefined,
        attributes,
      },
    };
  }

  private buildFieldAttributes(fieldData: ApiFieldFormat) {
    return fieldData.data.attributes
      ? {
          subType: fieldData.data.attributes.subType,
          onDelete: fieldData.data.attributes.onDelete as RelationOnDeleteAction | undefined,
          filters: fieldData.data.attributes.filters as Array<Array<any>> | undefined,
        }
      : undefined;
  }

  /**
   * Execute field deletion with special handling
   */
  private async executeFieldDeletion(
    fieldData: ApiFieldFormat,
    userId: string,
  ): Promise<FieldExecutionResult> {
    try {
      const deleteFieldDto = {
        objName: fieldData.objName,
        action: 'delete' as const,
        name: fieldData.data.name,
        data: {
          name: fieldData.data.name,
          typeName: fieldData.data.typeName,
          displayName: fieldData.data.displayName,
        },
      };

      const result = await this.nflowObjectService.changeField(deleteFieldDto, userId);
      this.logger.log(`Field deletion completed successfully: ${result.name}`);

      return {
        success: true,
        fieldId: result.name,
        fieldName: fieldData.data.name,
      };
    } catch (error) {
      this.logger.error('Failed to delete field via API', error);
      return {
        success: false,
        fieldName: fieldData.data.name,
        error: error instanceof Error ? error.message : 'Field deletion failed',
      };
    }
  }

  private processBatchResults(
    results: PromiseSettledResult<FieldExecutionResult>[],
  ): BatchFieldExecutionResult {
    const successful: Array<{ fieldId: string; fieldName: string }> = [];
    const failed: Array<{ fieldName: string; error: string }> = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.fieldId) {
        successful.push({
          fieldId: result.value.fieldId,
          fieldName: result.value.fieldName || 'Unknown',
        });
      } else {
        const error = result.status === 'fulfilled' ? result.value.error : String(result.reason);
        const fieldName =
          result.status === 'fulfilled' ? result.value.fieldName || 'Unknown' : 'Unknown';
        failed.push({
          fieldName,
          error: error || 'Unknown error',
        });
      }
    });

    return {
      successful,
      failed,
      hasSuccessfulOperations: successful.length > 0,
      hasFailedOperations: failed.length > 0,
    };
  }
}
