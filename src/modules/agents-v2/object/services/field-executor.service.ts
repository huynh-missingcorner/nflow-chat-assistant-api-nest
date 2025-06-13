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
  error?: string;
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
      this.logger.debug(
        `Executing ${action} field operation for: ${fieldData.data.name}`,
        JSON.stringify(fieldData, null, 2),
      );

      // Initialize object name mapping
      const objectNameMapping = options.objectNameMapping || new Map<string, string>();

      // Add mappings from state if available
      if (options.state?.objectNameMapping) {
        for (const [originalName, uniqueName] of Object.entries(options.state.objectNameMapping)) {
          objectNameMapping.set(originalName, uniqueName);
        }
      }

      // Add mappings from created objects in current thread
      if (options.state?.createdObjects && options.state.createdObjects.length > 0) {
        for (const obj of options.state.createdObjects) {
          objectNameMapping.set(obj.originalName, obj.uniqueName);
        }
      }

      // Get the correct object name (use mapping if available)
      const objName = objectNameMapping.get(fieldData.objName) || fieldData.objName;

      // For relation fields, also map the target object name
      let fieldValue = fieldData.data.value || undefined;
      if (fieldData.data.typeName === 'relation' && fieldValue) {
        const mappedTargetObject = objectNameMapping.get(fieldValue);
        if (mappedTargetObject) {
          fieldValue = mappedTargetObject;
          this.logger.debug(
            `Mapped relation target from '${fieldData.data.value}' to '${mappedTargetObject}'`,
          );
        } else {
          this.logger.warn(
            `No mapping found for relation target object '${fieldValue}', using original name`,
          );
        }

        this.logger.debug(
          `Processing relation field '${fieldData.data.name}' with target object '${fieldValue}'`,
        );
      }

      // Properly transform attributes to match FieldAttributesDto
      const attributes = fieldData.data.attributes
        ? {
            subType: fieldData.data.attributes.subType,
            onDelete: fieldData.data.attributes.onDelete as RelationOnDeleteAction | undefined,
            filters: fieldData.data.attributes.filters as Array<Array<any>> | undefined,
          }
        : undefined;

      // Get pickListId from field specification if available (for newly created pickLists)
      let pickListId = fieldData.data.pickListId;
      if (
        fieldData.data.typeName === 'pickList' &&
        options.state?.fieldSpec &&
        options.state.fieldSpec.pickListInfo &&
        options.state.fieldSpec.pickListInfo.createdPickListId
      ) {
        pickListId = options.state.fieldSpec.pickListInfo.createdPickListId;
        this.logger.debug(
          `Using created pickListId: ${pickListId} for field: ${fieldData.data.name}`,
        );
      }

      // Validate that pickList fields have a pickListId
      if (fieldData.data.typeName === 'pickList' && !pickListId) {
        this.logger.warn(
          `PickList field ${fieldData.data.name} is missing pickListId - this may cause API errors`,
        );
      }

      // Handle delete operations differently
      if (action === 'delete') {
        return await this.executeFieldDeletion(fieldData, options.userId);
      }

      // Build the FieldDto for create/update/recover operations
      const fieldDto: FieldDto = {
        objName: objName,
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

      const result = await this.nflowObjectService.changeField(fieldDto, options.userId);

      this.logger.log(`Field ${action} completed successfully: ${result.name}`);
      return {
        success: true,
        fieldId: result.name,
      };
    } catch (error) {
      this.logger.error(`Failed to ${action} field via API`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Field ${action} failed`,
      };
    }
  }

  /**
   * Execute field deletion with special handling
   */
  private async executeFieldDeletion(
    fieldData: ApiFieldFormat,
    userId: string,
  ): Promise<FieldExecutionResult> {
    try {
      // For delete operations, the API expects different parameters
      const deleteFieldDto = {
        objName: fieldData.objName,
        action: 'delete' as const,
        name: fieldData.data.name, // The API expects the field name directly for delete
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
      };
    } catch (error) {
      this.logger.error('Failed to delete field via API', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Field deletion failed',
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
  ): Promise<{
    successful: Array<{ fieldId: string; fieldName: string }>;
    failed: Array<{ fieldName: string; error: string }>;
    hasSuccessfulOperations: boolean;
    hasFailedOperations: boolean;
  }> {
    const successful: Array<{ fieldId: string; fieldName: string }> = [];
    const failed: Array<{ fieldName: string; error: string }> = [];

    for (const fieldData of fieldsData) {
      const result = await this.executeField(fieldData, action, options);

      if (result.success && result.fieldId) {
        successful.push({
          fieldId: result.fieldId,
          fieldName: fieldData.data.name,
        });
      } else {
        failed.push({
          fieldName: fieldData.data.name,
          error: result.error || 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      hasSuccessfulOperations: successful.length > 0,
      hasFailedOperations: failed.length > 0,
    };
  }
}
