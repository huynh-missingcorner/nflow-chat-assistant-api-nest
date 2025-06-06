import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';

import { ObjectGraphBuilder } from './builders/object-graph.builder';
import {
  OBJECT_GRAPH_CONFIG,
  OBJECT_GRAPH_NODES,
  OBJECT_LOG_MESSAGES,
  OBJECT_SUCCESS_MESSAGES,
} from './constants/object-graph.constants';
import { ObjectAgentInput, ObjectAgentOutput } from './types';
import { ObjectStateType } from './types/object-graph-state.types';

export interface IObjectAgentService {
  run(input: ObjectAgentInput): Promise<ObjectAgentOutput>;
}

@Injectable()
export class ObjectAgentService implements IObjectAgentService, OnModuleInit {
  private readonly logger = new Logger(ObjectAgentService.name);

  private graph: ReturnType<typeof StateGraph.prototype.compile>;

  constructor(private readonly graphBuilder: ObjectGraphBuilder) {}

  onModuleInit(): void {
    this.initializeGraph();
  }

  async run(input: ObjectAgentInput): Promise<ObjectAgentOutput> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.PROCESSING_REQUEST(input.message));

      const result = await this.executeGraph(input);

      return this.processGraphResult(result, input);
    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  private initializeGraph(): void {
    this.graph = this.graphBuilder.buildGraph();
    this.logger.log(OBJECT_LOG_MESSAGES.GRAPH_COMPILED);
  }

  private async executeGraph(input: ObjectAgentInput): Promise<ObjectStateType> {
    const initialState = this.createInitialState(input);

    const result = await this.graph.invoke(initialState, {
      configurable: {
        thread_id: input.chatSessionId || OBJECT_GRAPH_CONFIG.DEFAULT_THREAD_ID,
      },
    });

    return result as ObjectStateType;
  }

  private createInitialState(input: ObjectAgentInput): Partial<ObjectStateType> {
    return {
      messages: [],
      originalMessage: input.message,
      chatSessionId: input.chatSessionId,
      fieldSpec: null,
      objectSpec: null,
      dbDesignResult: null,
      typeMappingResult: null,
      executionResult: null,
      error: null,
      currentNode: OBJECT_GRAPH_CONFIG.INITIAL_NODE,
      retryCount: 0,
      isCompleted: false,
    };
  }

  private processGraphResult(result: ObjectStateType, input: ObjectAgentInput): ObjectAgentOutput {
    if (this.isSuccessfulExecution(result)) {
      return this.createSuccessResponse(result, input);
    } else {
      return this.createErrorResponse(result);
    }
  }

  private isSuccessfulExecution(result: ObjectStateType): boolean {
    return (
      result.currentNode === OBJECT_GRAPH_NODES.HANDLE_SUCCESS &&
      !!result.executionResult &&
      result.executionResult.status === 'success'
    );
  }

  private createSuccessResponse(
    result: ObjectStateType,
    input: ObjectAgentInput,
  ): ObjectAgentOutput {
    const message = this.buildSuccessMessage(result);

    return {
      success: true,
      message,
      data: {
        executionResult: result.executionResult!,
        originalMessage: input.message,
        chatSessionId: input.chatSessionId,
        fieldSpec: result.fieldSpec || null,
        objectSpec: result.objectSpec || null,
        dbDesignResult: result.dbDesignResult || null,
        typeMappingResult: result.typeMappingResult || null,
      },
    };
  }

  private buildSuccessMessage(result: ObjectStateType): string {
    if (result.objectSpec) {
      return OBJECT_SUCCESS_MESSAGES.OBJECT_CREATED;
    } else if (result.fieldSpec) {
      return OBJECT_SUCCESS_MESSAGES.FIELD_ADDED;
    }
    return 'Object operation completed successfully';
  }

  private createErrorResponse(result: ObjectStateType): ObjectAgentOutput {
    return {
      success: false,
      message: OBJECT_SUCCESS_MESSAGES.PROCESSING_FAILED,
      data: {
        error: result.error || 'Object generation failed',
        currentNode: result.currentNode,
        retryCount: result.retryCount,
      },
    };
  }

  private handleExecutionError(error: unknown): ObjectAgentOutput {
    this.logger.error(OBJECT_LOG_MESSAGES.GRAPH_EXECUTION_FAILED, error);

    return {
      success: false,
      message: OBJECT_SUCCESS_MESSAGES.PROCESSING_FAILED,
      data: {
        error: error instanceof Error ? error.message : 'Object generation failed',
      },
    };
  }
}
