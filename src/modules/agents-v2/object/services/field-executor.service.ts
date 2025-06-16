import { Injectable, Logger } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { FieldDto } from '@/modules/nflow/types';

import type { ApiFormatParserInput } from '../tools/others/api-format-parser.tool';
import { ObjectExecutionResult, ObjectStateType } from '../types/object-graph-state.types';
import {
  FieldExecutionPlan,
  FieldExecutionStep,
  FieldStepResult,
  IFieldExecutorService,
} from './interfaces/field-executor.service.interface';

@Injectable()
export class FieldExecutorService implements IFieldExecutorService {
  private readonly logger = new Logger(FieldExecutorService.name);

  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly nflowObjectService: NFlowObjectService,
  ) {}

  buildFieldExecutionPlan(state: ObjectStateType): FieldExecutionPlan | null {
    try {
      const typeMappingResult = state.typeMappingResult;
      const apiFormat: ApiFormatParserInput | undefined = typeMappingResult?.apiFormat;

      if (!apiFormat) {
        this.logger.error('No API format found in type mapping result');
        return null;
      }

      const steps: FieldExecutionStep[] = [];

      if (apiFormat.fieldsFormat && apiFormat.fieldsFormat.length > 0) {
        for (const fieldFormat of apiFormat.fieldsFormat) {
          const action = state.fieldSpec?.action || 'create';
          steps.push({
            type: `${action}_field`,
            action,
            fieldData: fieldFormat,
            description: `${action} field: ${fieldFormat.data.name}`,
          });
        }
      }

      this.logger.debug(`Built field execution plan with ${steps.length} steps`);
      return { steps };
    } catch (error) {
      this.logger.error('Error building field execution plan', error);
      return null;
    }
  }

  async executeFieldSteps(
    steps: FieldExecutionStep[],
    chatSessionId: string,
    state: ObjectStateType,
    previousResult?: ObjectExecutionResult,
  ): Promise<ObjectExecutionResult> {
    const result: ObjectExecutionResult = {
      status: 'success',
      fieldIds: [...(previousResult?.fieldIds || [])],
      createdEntities: previousResult?.createdEntities
        ? {
            ...previousResult.createdEntities,
            fields: Array.isArray(previousResult.createdEntities.fields)
              ? [...previousResult.createdEntities.fields]
              : previousResult.createdEntities.fields,
          }
        : {},
      errors: [...(previousResult?.errors || [])],
      completedSteps: [...(previousResult?.completedSteps || [])],
      objectId: previousResult?.objectId,
    };

    let userId: string;
    try {
      userId = await this.chatSessionService.getUserIdFromChatSession(chatSessionId);
    } catch (error) {
      this.logger.error('Failed to get userId from chatSessionId', error);
      return {
        status: 'failed',
        errors: [
          `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        fieldIds: [],
        createdEntities: {},
        completedSteps: [],
      };
    }

    let hasSuccessfulSteps = false;
    let hasFailedSteps = false;

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        this.logger.log(`Executing field step ${i + 1}/${steps.length}: ${step.description}`);

        const stepResult = await this.executeFieldStep(step, userId, state);

        if (!stepResult.success) {
          hasFailedSteps = true;
          if (result.errors) {
            result.errors.push(`Step ${i + 1} failed: ${stepResult.error || 'Unknown error'}`);
          }
          this.logger.warn(`Field step ${i + 1} failed but continuing with remaining steps`);
          continue;
        }

        hasSuccessfulSteps = true;

        if (result.completedSteps) {
          result.completedSteps.push({
            type: step.type,
            stepIndex: i,
            entityId: stepResult.fieldId || 'Unknown',
            entityName: stepResult.fieldId || undefined,
          });
        }

        const fieldId = stepResult.fieldId || '';
        if (result.fieldIds && !result.fieldIds.includes(fieldId)) {
          result.fieldIds.push(fieldId);
        }

        if (!result.createdEntities) result.createdEntities = {};
        if (!result.createdEntities.fields) {
          result.createdEntities.fields = [];
        }
        if (Array.isArray(result.createdEntities.fields)) {
          const fieldName = stepResult.fieldId || 'Unknown';
          if (!result.createdEntities.fields.includes(fieldName)) {
            result.createdEntities.fields.push(fieldName);
          }
        }
      }

      const hasAnySuccessfulOperations =
        hasSuccessfulSteps ||
        (result.fieldIds && result.fieldIds.length > 0) ||
        (result.completedSteps && result.completedSteps.length > 0);

      if (hasFailedSteps && !hasAnySuccessfulOperations) {
        result.status = 'failed';
      } else if (hasFailedSteps && hasAnySuccessfulOperations) {
        result.status = 'partial';
      } else if (hasAnySuccessfulOperations) {
        result.status = 'success';
      } else {
        result.status = 'failed';
      }

      return result;
    } catch (error) {
      this.logger.error('Error during field step execution', error);
      const errorMessage = error instanceof Error ? error.message : 'Field step execution failed';
      if (result.errors) {
        result.errors.push(errorMessage);
      } else {
        result.errors = [errorMessage];
      }
      result.status = hasSuccessfulSteps ? 'partial' : 'failed';
      return result;
    }
  }

  async executeFieldStep(
    step: FieldExecutionStep,
    userId: string,
    state: ObjectStateType,
  ): Promise<FieldStepResult> {
    try {
      this.logger.debug(
        `Executing ${step.type} with data:`,
        JSON.stringify(step.fieldData, null, 2),
      );

      const fieldDto = this.transformFieldDataToDto(step, state);

      if (step.action === 'delete') {
        const deleteFieldDto = {
          objName: step.fieldData.objName,
          action: 'delete' as const,
          name: step.fieldData.data.name,
          data: {
            name: step.fieldData.data.name,
            typeName: step.fieldData.data.typeName,
            displayName: step.fieldData.data.displayName,
          },
        };

        const result = await this.nflowObjectService.changeField(deleteFieldDto, userId);
        this.logger.log(`Field ${step.action} completed successfully: ${result.name}`);
        return {
          success: true,
          fieldId: result.name,
        };
      }

      const result = await this.nflowObjectService.changeField(fieldDto, userId);

      this.logger.log(`Field ${step.action} completed successfully: ${result.name}`);
      return {
        success: true,
        fieldId: result.name,
      };
    } catch (error) {
      this.logger.error(`Failed to ${step.action} field via API`);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Field ${step.action} failed`,
      };
    }
  }

  transformFieldDataToDto(step: FieldExecutionStep, state: ObjectStateType): FieldDto {
    const fieldData = step.fieldData;
    const objectNameMapping = this.buildObjectNameMapping(state);

    const objName = objectNameMapping.get(fieldData.objName) || fieldData.objName;

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

    const attributes = fieldData.data.attributes
      ? {
          subType: fieldData.data.attributes.subType,
          onDelete: fieldData.data.attributes.onDelete as
            | 'noAction'
            | 'setNull'
            | 'cascade'
            | undefined,
          filters: fieldData.data.attributes.filters as Array<Array<any>> | undefined,
        }
      : undefined;

    let pickListId = fieldData.data.pickListId;
    if (
      fieldData.data.typeName === 'pickList' &&
      state.fieldSpec &&
      state.fieldSpec.pickListInfo &&
      state.fieldSpec.pickListInfo.createdPickListId
    ) {
      pickListId = state.fieldSpec.pickListInfo.createdPickListId;
      this.logger.debug(
        `Using created pickListId: ${pickListId} for field: ${fieldData.data.name}`,
      );
    }

    if (fieldData.data.typeName === 'pickList' && !pickListId) {
      this.logger.warn(
        `PickList field ${fieldData.data.name} is missing pickListId - this may cause API errors`,
      );
    }

    if (step.action === 'delete') {
      return {
        objName: fieldData.objName,
        action: 'delete',
        name: fieldData.data.name,
        data: {
          name: fieldData.data.name,
          typeName: fieldData.data.typeName,
          displayName: fieldData.data.displayName,
        },
      };
    }

    return {
      objName: objName,
      action: step.action,
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

  buildObjectNameMapping(state: ObjectStateType): Map<string, string> {
    const objectNameMapping = new Map<string, string>();

    if (state.objectNameMapping) {
      for (const [originalName, uniqueName] of Object.entries(state.objectNameMapping)) {
        objectNameMapping.set(originalName, uniqueName);
      }
    }

    if (state.createdObjects && state.createdObjects.length > 0) {
      for (const obj of state.createdObjects) {
        objectNameMapping.set(obj.originalName, obj.uniqueName);
      }
    }

    return objectNameMapping;
  }
}
