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

      const typeMappingResult = state.typeMappingResult;
      const apiFormat: ApiFormatParserInput | undefined = typeMappingResult?.apiFormat;

      if (!apiFormat) {
        return this.createErrorResult('No API format found in type mapping result');
      }

      // Get userId from chatSessionId
      let userId: string;
      try {
        userId = await this.objectExecutorService.getUserIdFromChatSession(state.chatSessionId);
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

      let executionResult: ObjectExecutionResult;

      // Execute object with fields using the service
      if (apiFormat.objectFormat) {
        const serviceResult = await this.objectExecutorService.executeObjectWithFields(
          apiFormat.objectFormat,
          apiFormat.fieldsFormat || [],
          options,
        );

        // Convert service result to ObjectExecutionResult format
        executionResult = {
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
      } else {
        return this.createErrorResult('No object format found in API format');
      }

      // Always return execution results, regardless of status
      // This ensures that successful operations are reported even when some steps fail
      if (executionResult.status === 'failed') {
        // Check if there were any successful operations
        const hasSuccessfulOperations =
          executionResult.objectId ||
          (executionResult.fieldIds && executionResult.fieldIds.length > 0) ||
          (executionResult.completedSteps && executionResult.completedSteps.length > 0);

        if (!hasSuccessfulOperations) {
          // Only return error result if absolutely nothing was created
          return this.createErrorResult(
            executionResult.errors?.join(', ') || 'Object execution failed',
            executionResult,
          );
        } else {
          // Even though status is failed, we have some successful operations
          // Return success result with the execution result containing both successes and failures
          return this.createExecutionSuccessResult(executionResult);
        }
      }

      // For success and partial status, always return success result
      return this.createExecutionSuccessResult(executionResult);
    } catch (error) {
      this.logger.error('Object execution failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Object execution failed',
      );
    }
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
