import { Injectable } from '@nestjs/common';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { FieldExecutorService } from '../services/field-executor.service';
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

      const executionPlan = this.fieldExecutorService.buildFieldExecutionPlan(state);

      if (!executionPlan || executionPlan.steps.length === 0) {
        return this.createErrorResult('Unable to build field execution plan from state');
      }

      const executionResult = await this.fieldExecutorService.executeFieldSteps(
        executionPlan.steps,
        state.chatSessionId,
        state,
        state.executionResult || undefined,
      );

      if (executionResult.status === 'failed') {
        const hasSuccessfulOperations =
          (executionResult.fieldIds && executionResult.fieldIds.length > 0) ||
          (executionResult.completedSteps && executionResult.completedSteps.length > 0);

        if (!hasSuccessfulOperations) {
          return this.createErrorResult(
            executionResult.errors?.join(', ') || 'Field execution failed',
            executionResult,
          );
        } else {
          return this.createExecutionSuccessResult(executionResult);
        }
      }

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
