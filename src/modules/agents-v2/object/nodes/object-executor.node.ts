import { Injectable } from '@nestjs/common';

import {
  EXECUTION_STEP_TYPES,
  OBJECT_GRAPH_NODES,
  OBJECT_LOG_MESSAGES,
} from '../constants/object-graph.constants';
import { ObjectExecutorService } from '../services/object-executor.service';
import type { ApiFormatParserInput } from '../tools/others/api-format-parser.tool';
import { ObjectExecutionResult, ObjectStateType } from '../types/object-graph-state.types';
import { ObjectGraphNodeBase } from './object-graph-node.base';

@Injectable()
export class ObjectExecutorNode extends ObjectGraphNodeBase {
  protected getNodeName(): string {
    return OBJECT_GRAPH_NODES.OBJECT_EXECUTOR;
  }

  constructor(private readonly objectExecutorService: ObjectExecutorService) {
    super();
  }

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.EXECUTION_COMPLETED);

      const apiFormat = this.extractApiFormat(state);
      const userId = await this.getUserId(state.chatSessionId);
      const executionResult = await this.executeObjectWithFields(state, apiFormat, userId);

      return this.handleExecutionResult(executionResult);
    } catch (error) {
      this.logger.error('Object execution failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Object execution failed',
      );
    }
  }

  private extractApiFormat(state: ObjectStateType): ApiFormatParserInput {
    const apiFormat = state.typeMappingResult?.apiFormat;

    if (!apiFormat) {
      throw new Error('No API format found in type mapping result');
    }

    if (!apiFormat.objectFormat) {
      throw new Error('No object format found in API format');
    }

    return apiFormat;
  }

  private async getUserId(chatSessionId: string): Promise<string> {
    try {
      return await this.objectExecutorService.getUserIdFromChatSession(chatSessionId);
    } catch (error) {
      this.logger.error('Failed to get userId from chatSessionId', error);
      throw new Error(
        `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async executeObjectWithFields(
    state: ObjectStateType,
    apiFormat: ApiFormatParserInput,
    userId: string,
  ): Promise<ObjectExecutionResult> {
    const options = this.buildExecutionOptions(state, userId);

    const serviceResult = await this.objectExecutorService.executeObjectWithFields(
      apiFormat.objectFormat,
      apiFormat.fieldsFormat || [],
      options,
    );

    return this.convertServiceResult(serviceResult);
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

  private convertServiceResult(
    serviceResult: Awaited<ReturnType<typeof this.objectExecutorService.executeObjectWithFields>>,
  ): ObjectExecutionResult {
    return {
      status: serviceResult.success ? 'success' : 'failed',
      objectId: serviceResult.objectId,
      fieldIds: serviceResult.fieldIds || [],
      createdEntities: serviceResult.createdEntities || {},
      errors: serviceResult.errors,
      completedSteps: serviceResult.completedSteps?.map((step) => ({
        ...step,
        type: step.type as (typeof EXECUTION_STEP_TYPES)[keyof typeof EXECUTION_STEP_TYPES],
      })),
    };
  }

  private handleExecutionResult(executionResult: ObjectExecutionResult): Partial<ObjectStateType> {
    if (executionResult.status === 'failed') {
      const hasSuccessfulOperations = this.hasAnySuccessfulOperations(executionResult);

      if (!hasSuccessfulOperations) {
        return this.createErrorResult(
          executionResult.errors?.join(', ') || 'Object execution failed',
          executionResult,
        );
      }
    }

    return this.createExecutionSuccessResult(executionResult);
  }

  private hasAnySuccessfulOperations(executionResult: ObjectExecutionResult): boolean {
    return Boolean(
      executionResult.objectId ||
        (executionResult.fieldIds && executionResult.fieldIds.length > 0) ||
        (executionResult.completedSteps && executionResult.completedSteps.length > 0),
    );
  }

  private createErrorResult(
    errorMessage: string,
    executionResult?: ObjectExecutionResult,
  ): Partial<ObjectStateType> {
    return {
      error: `Object execution failed: ${errorMessage}`,
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
