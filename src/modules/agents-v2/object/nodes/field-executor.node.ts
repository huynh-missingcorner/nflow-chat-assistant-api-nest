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

      const typeMappingResult = state.typeMappingResult;
      const apiFormat: ApiFormatParserInput | undefined = typeMappingResult?.apiFormat;

      if (!apiFormat) {
        return this.createErrorResult('No API format found in type mapping result');
      }

      // Get userId from chatSessionId
      let userId: string;
      try {
        userId = await this.fieldExecutorService.getUserIdFromChatSession(state.chatSessionId);
      } catch (error) {
        this.logger.error('Failed to get userId from chatSessionId', error);
        return this.createErrorResult(
          `Failed to get user information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      // Prepare options for the service
      const options = {
        userId,
        objectNameMapping: state.objectNameMapping
          ? new Map(Object.entries(state.objectNameMapping))
          : undefined,
        state,
      };

      // Only process fields - no object creation in field executor
      if (!apiFormat.fieldsFormat || apiFormat.fieldsFormat.length === 0) {
        return this.createErrorResult('No fields found in API format');
      }

      const action = state.fieldSpec?.action || 'create';
      const fieldsResult = await this.fieldExecutorService.executeFields(
        apiFormat.fieldsFormat,
        action,
        options,
      );

      // Convert service result to ObjectExecutionResult format
      const executionResult: ObjectExecutionResult = {
        status:
          fieldsResult.hasFailedOperations && !fieldsResult.hasSuccessfulOperations
            ? 'failed'
            : fieldsResult.hasFailedOperations && fieldsResult.hasSuccessfulOperations
              ? 'partial'
              : 'success',
        fieldIds: fieldsResult.successful.map((f) => f.fieldId),
        createdEntities: {
          fields: fieldsResult.successful.map((f) => f.fieldId),
          fieldsDetailed: JSON.stringify(
            fieldsResult.successful.map((field, index) => ({
              name: apiFormat.fieldsFormat[index].data.name,
              displayName: apiFormat.fieldsFormat[index].data.displayName,
              typeName: apiFormat.fieldsFormat[index].data.typeName,
              description: apiFormat.fieldsFormat[index].data.description,
            })),
          ),
        },
        errors: fieldsResult.failed.map((f) => f.error),
        completedSteps: fieldsResult.successful.map((field, index) => ({
          type: EXECUTION_STEP_TYPES.CREATE_FIELD as (typeof EXECUTION_STEP_TYPES)[keyof typeof EXECUTION_STEP_TYPES],
          stepIndex: index,
          entityId: field.fieldId,
          entityName: field.fieldName,
        })),
      };

      // Always return execution results, regardless of status
      if (executionResult.status === 'failed') {
        // Check if there were any successful operations
        const hasSuccessfulOperations =
          (executionResult.fieldIds && executionResult.fieldIds.length > 0) ||
          (executionResult.completedSteps && executionResult.completedSteps.length > 0);

        if (!hasSuccessfulOperations) {
          return this.createErrorResult(
            executionResult.errors?.join(', ') || 'Field execution failed',
            executionResult,
          );
        } else {
          // Even though status is failed, we have some successful operations
          return this.createExecutionSuccessResult(executionResult);
        }
      }

      // For success and partial status, always return success result
      return this.createExecutionSuccessResult(executionResult);
    } catch (error) {
      this.logger.error('Field execution failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Field execution failed',
      );
    }
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
