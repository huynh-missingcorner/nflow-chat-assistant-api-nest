import { Injectable } from '@nestjs/common';

import {
  EXECUTION_STEP_TYPES,
  OBJECT_GRAPH_NODES,
  OBJECT_LOG_MESSAGES,
} from '../constants/object-graph.constants';
import { FieldExecutorService } from '../services/field-executor.service';
import type { ApiFormatParserInput } from '../tools/others/api-format-parser.tool';
import { ObjectExecutionResult, ObjectStateType } from '../types/object-graph-state.types';
import { ObjectGraphNodeBase } from './object-graph-node.base';

@Injectable()
export class FieldExecutorNode extends ObjectGraphNodeBase {
  protected getNodeName(): string {
    return OBJECT_GRAPH_NODES.FIELD_EXECUTOR;
  }

  constructor(private readonly fieldExecutorService: FieldExecutorService) {
    super();
  }

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.FIELD_EXECUTION_COMPLETED);

      const apiFormat = this.extractApiFormat(state);
      const userId = await this.getUserId(state.chatSessionId);
      const executionResult = await this.executeFieldOperations(state, apiFormat, userId);

      return this.handleExecutionResult(executionResult);
    } catch (error) {
      this.logger.error('Field execution failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Field execution failed',
      );
    }
  }

  private extractApiFormat(state: ObjectStateType): ApiFormatParserInput {
    const apiFormat = state.typeMappingResult?.apiFormat;

    if (!apiFormat) {
      throw new Error('No API format found in type mapping result');
    }

    if (!apiFormat.fieldsFormat || apiFormat.fieldsFormat.length === 0) {
      throw new Error('No fields found in API format');
    }

    return apiFormat;
  }

  private async getUserId(chatSessionId: string): Promise<string> {
    try {
      return await this.fieldExecutorService.getUserIdFromChatSession(chatSessionId);
    } catch (error) {
      this.logger.error('Failed to get userId from chatSessionId', error);
      throw new Error(
        `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async executeFieldOperations(
    state: ObjectStateType,
    apiFormat: ApiFormatParserInput,
    userId: string,
  ): Promise<ObjectExecutionResult> {
    const options = this.buildExecutionOptions(state, userId);
    const action = state.fieldSpec?.action || 'create';

    const fieldsResult = await this.fieldExecutorService.executeFields(
      apiFormat.fieldsFormat,
      action,
      options,
    );

    return this.convertToExecutionResult(fieldsResult, apiFormat);
  }

  private buildExecutionOptions(state: ObjectStateType, userId: string) {
    return {
      userId,
      objectNameMapping: state.objectNameMapping
        ? new Map(Object.entries(state.objectNameMapping))
        : undefined,
      state,
    };
  }

  private convertToExecutionResult(
    fieldsResult: Awaited<ReturnType<typeof this.fieldExecutorService.executeFields>>,
    apiFormat: ApiFormatParserInput,
  ): ObjectExecutionResult {
    const status = this.determineExecutionStatus(fieldsResult);

    return {
      status,
      fieldIds: fieldsResult.successful.map((f) => f.fieldId),
      createdEntities: {
        fields: fieldsResult.successful.map((f) => f.fieldId),
        fieldsDetailed: this.buildFieldsDetailedInfo(fieldsResult.successful, apiFormat),
      },
      errors: fieldsResult.failed.map((f) => f.error),
      completedSteps: this.buildCompletedSteps(fieldsResult.successful),
    };
  }

  private determineExecutionStatus(
    fieldsResult: Awaited<ReturnType<typeof this.fieldExecutorService.executeFields>>,
  ): 'success' | 'partial' | 'failed' {
    if (fieldsResult.hasFailedOperations && !fieldsResult.hasSuccessfulOperations) {
      return 'failed';
    }
    if (fieldsResult.hasFailedOperations && fieldsResult.hasSuccessfulOperations) {
      return 'partial';
    }
    return 'success';
  }

  private buildFieldsDetailedInfo(
    successful: Array<{ fieldId: string; fieldName: string }>,
    apiFormat: ApiFormatParserInput,
  ): string {
    return JSON.stringify(
      successful.map((field, index) => ({
        name: apiFormat.fieldsFormat[index].data.name,
        displayName: apiFormat.fieldsFormat[index].data.displayName,
        typeName: apiFormat.fieldsFormat[index].data.typeName,
        description: apiFormat.fieldsFormat[index].data.description,
      })),
    );
  }

  private buildCompletedSteps(successful: Array<{ fieldId: string; fieldName: string }>) {
    return successful.map((field, index) => ({
      type: EXECUTION_STEP_TYPES.CREATE_FIELD as (typeof EXECUTION_STEP_TYPES)[keyof typeof EXECUTION_STEP_TYPES],
      stepIndex: index,
      entityId: field.fieldId,
      entityName: field.fieldName,
    }));
  }

  private handleExecutionResult(executionResult: ObjectExecutionResult): Partial<ObjectStateType> {
    if (executionResult.status === 'failed') {
      const hasSuccessfulOperations = this.hasAnySuccessfulOperations(executionResult);

      if (!hasSuccessfulOperations) {
        return this.createErrorResult(
          executionResult.errors?.join(', ') || 'Field execution failed',
          executionResult,
        );
      }
    }

    return this.createExecutionSuccessResult(executionResult);
  }

  private hasAnySuccessfulOperations(executionResult: ObjectExecutionResult): boolean {
    return Boolean(
      (executionResult.fieldIds && executionResult.fieldIds.length > 0) ||
        (executionResult.completedSteps && executionResult.completedSteps.length > 0),
    );
  }

  private createErrorResult(
    errorMessage: string,
    executionResult?: ObjectExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      error: `Field execution failed: ${errorMessage}`,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      executionResult,
    };
  }

  private createExecutionSuccessResult(
    executionResult: ObjectExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      executionResult,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
      isCompleted: true,
    };
  }
}
