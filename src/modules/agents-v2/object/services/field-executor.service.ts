import { Injectable, Logger } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { NFlowObjectService } from '@/modules/nflow/services/object.service';
import { FieldDto } from '@/modules/nflow/types';

import type { ApiFormatParserInput } from '../tools/others/api-format-parser.tool';
import { ObjectExecutionResult, ObjectStateType } from '../types/object-graph-state.types';
import {
  ExecutionContext,
  ExecutionStatus,
  FieldAttributes,
  FieldExecutionPlan,
  FieldExecutionStep,
  FieldFormatData,
  FieldStepResult,
  FieldTransformationContext,
  IFieldExecutorService,
  StepExecutionSummary,
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

      const steps = this.buildExecutionSteps(apiFormat, state);
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
    const result = this.initializeExecutionResult(previousResult);

    try {
      const context = await this.createExecutionContext(chatSessionId, state);
      const summary = await this.processAllSteps(steps, context, result);

      result.status = this.determineExecutionStatus(summary, result);
      return result;
    } catch (error) {
      return this.handleExecutionError(error);
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
      const apiResult = await this.nflowObjectService.changeField(fieldDto, userId);

      this.logger.log(`Field ${step.action} completed successfully: ${apiResult.name}`);
      return {
        success: true,
        fieldId: apiResult.name,
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
    const context: FieldTransformationContext = {
      step,
      state,
      objectNameMapping: this.buildObjectNameMapping(state),
    };

    if (step.action === 'delete') {
      return this.createDeleteFieldDto(context);
    }

    return this.createStandardFieldDto(context);
  }

  buildObjectNameMapping(state: ObjectStateType): Map<string, string> {
    const objectNameMapping = new Map<string, string>();

    this.addObjectNameMappings(objectNameMapping, state);
    this.addCreatedObjectMappings(objectNameMapping, state);

    return objectNameMapping;
  }

  private buildExecutionSteps(
    apiFormat: ApiFormatParserInput,
    state: ObjectStateType,
  ): FieldExecutionStep[] {
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

    return steps;
  }

  private initializeExecutionResult(previousResult?: ObjectExecutionResult): ObjectExecutionResult {
    return {
      status: 'success',
      fieldIds: [...(previousResult?.fieldIds || [])],
      createdEntities: this.initializeCreatedEntities(previousResult),
      errors: [...(previousResult?.errors || [])],
      completedSteps: [...(previousResult?.completedSteps || [])],
      objectId: previousResult?.objectId,
    };
  }

  private initializeCreatedEntities(
    previousResult?: ObjectExecutionResult,
  ): ObjectExecutionResult['createdEntities'] {
    if (!previousResult?.createdEntities) {
      return {};
    }

    return {
      ...previousResult.createdEntities,
      fields: Array.isArray(previousResult.createdEntities.fields)
        ? [...previousResult.createdEntities.fields]
        : previousResult.createdEntities.fields,
    };
  }

  private async createExecutionContext(
    chatSessionId: string,
    state: ObjectStateType,
  ): Promise<ExecutionContext> {
    try {
      const userId = await this.chatSessionService.getUserIdFromChatSession(chatSessionId);
      return {
        userId,
        chatSessionId,
        state,
        objectNameMapping: this.buildObjectNameMapping(state),
      };
    } catch (error) {
      this.logger.error('Failed to get userId from chatSessionId', error);
      throw new Error(
        `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async processAllSteps(
    steps: FieldExecutionStep[],
    context: ExecutionContext,
    result: ObjectExecutionResult,
  ): Promise<StepExecutionSummary> {
    const summary: StepExecutionSummary = {
      hasSuccessfulSteps: false,
      hasFailedSteps: false,
      totalSteps: steps.length,
      completedSteps: 0,
    };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      this.logger.log(`Executing field step ${i + 1}/${steps.length}: ${step.description}`);

      const stepResult = await this.executeFieldStep(step, context.userId, context.state);

      if (!stepResult.success) {
        summary.hasFailedSteps = true;
        this.handleStepFailure(stepResult, i, result);
        continue;
      }

      summary.hasSuccessfulSteps = true;
      summary.completedSteps++;
      this.handleStepSuccess(stepResult, step, i, result);
    }

    return summary;
  }

  private handleStepFailure(
    stepResult: FieldStepResult,
    stepIndex: number,
    result: ObjectExecutionResult,
  ): void {
    if (result.errors) {
      result.errors.push(`Step ${stepIndex + 1} failed: ${stepResult.error || 'Unknown error'}`);
    }
    this.logger.warn(`Field step ${stepIndex + 1} failed but continuing with remaining steps`);
  }

  private handleStepSuccess(
    stepResult: FieldStepResult,
    step: FieldExecutionStep,
    stepIndex: number,
    result: ObjectExecutionResult,
  ): void {
    this.addCompletedStep(step, stepIndex, stepResult, result);
    this.addFieldId(stepResult.fieldId, result);
    this.addCreatedField(stepResult.fieldId, result);
  }

  private addCompletedStep(
    step: FieldExecutionStep,
    stepIndex: number,
    stepResult: FieldStepResult,
    result: ObjectExecutionResult,
  ): void {
    if (result.completedSteps) {
      result.completedSteps.push({
        type: step.type,
        stepIndex,
        entityId: stepResult.fieldId || 'Unknown',
        entityName: stepResult.fieldId || undefined,
      });
    }
  }

  private addFieldId(fieldId: string | undefined, result: ObjectExecutionResult): void {
    const id = fieldId || '';
    if (result.fieldIds && !result.fieldIds.includes(id)) {
      result.fieldIds.push(id);
    }
  }

  private addCreatedField(fieldId: string | undefined, result: ObjectExecutionResult): void {
    if (!result.createdEntities) result.createdEntities = {};
    if (!result.createdEntities.fields) {
      result.createdEntities.fields = [];
    }

    if (Array.isArray(result.createdEntities.fields)) {
      const fieldName = fieldId || 'Unknown';
      if (!result.createdEntities.fields.includes(fieldName)) {
        result.createdEntities.fields.push(fieldName);
      }
    }
  }

  private determineExecutionStatus(
    summary: StepExecutionSummary,
    result: ObjectExecutionResult,
  ): ExecutionStatus {
    const hasAnySuccessfulOperations =
      summary.hasSuccessfulSteps ||
      (result.fieldIds && result.fieldIds.length > 0) ||
      (result.completedSteps && result.completedSteps.length > 0);

    if (summary.hasFailedSteps && !hasAnySuccessfulOperations) {
      return 'failed';
    }

    if (summary.hasFailedSteps && hasAnySuccessfulOperations) {
      return 'partial';
    }

    if (hasAnySuccessfulOperations) {
      return 'success';
    }

    return 'failed';
  }

  private handleExecutionError(error: unknown): ObjectExecutionResult {
    this.logger.error('Error during field step execution', error);
    const errorMessage = error instanceof Error ? error.message : 'Field step execution failed';

    return {
      status: 'failed',
      errors: [errorMessage],
      fieldIds: [],
      createdEntities: {},
      completedSteps: [],
    };
  }

  private createDeleteFieldDto(context: FieldTransformationContext): FieldDto {
    const { step } = context;
    return {
      objName: step.fieldData.objName,
      action: 'delete',
      name: step.fieldData.data.name,
      data: {
        name: step.fieldData.data.name,
        typeName: step.fieldData.data.typeName,
        displayName: step.fieldData.data.displayName,
      },
    };
  }

  private createStandardFieldDto(context: FieldTransformationContext): FieldDto {
    const { step, objectNameMapping } = context;
    const fieldData = step.fieldData;

    const objName = this.resolveObjectName(fieldData.objName, objectNameMapping);
    const fieldValue = this.processFieldValue(fieldData, objectNameMapping);
    const attributes = this.buildFieldAttributes(fieldData);
    const pickListId = this.resolvePickListId(fieldData, context.state);

    return {
      objName,
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

  private resolveObjectName(objName: string, objectNameMapping: Map<string, string>): string {
    return objectNameMapping.get(objName) || objName;
  }

  private processFieldValue(
    fieldData: FieldFormatData,
    objectNameMapping: Map<string, string>,
  ): string | undefined {
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

    return fieldValue;
  }

  private buildFieldAttributes(fieldData: FieldFormatData): FieldAttributes | undefined {
    if (!fieldData.data.attributes) {
      return undefined;
    }

    return {
      subType: fieldData.data.attributes.subType,
      onDelete: fieldData.data.attributes.onDelete as
        | 'noAction'
        | 'setNull'
        | 'cascade'
        | undefined,
      filters: fieldData.data.attributes.filters as FieldAttributes['filters'],
    };
  }

  private resolvePickListId(
    fieldData: FieldFormatData,
    state: ObjectStateType,
  ): string | undefined {
    let pickListId = fieldData.data.pickListId || undefined;

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

    return pickListId;
  }

  private addObjectNameMappings(
    objectNameMapping: Map<string, string>,
    state: ObjectStateType,
  ): void {
    if (state.objectNameMapping) {
      for (const [originalName, uniqueName] of Object.entries(state.objectNameMapping)) {
        objectNameMapping.set(originalName, uniqueName);
      }
    }
  }

  private addCreatedObjectMappings(
    objectNameMapping: Map<string, string>,
    state: ObjectStateType,
  ): void {
    if (state.createdObjects && state.createdObjects.length > 0) {
      for (const obj of state.createdObjects) {
        objectNameMapping.set(obj.originalName, obj.uniqueName);
      }
    }
  }
}
