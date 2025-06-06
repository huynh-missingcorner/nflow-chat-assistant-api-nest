import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';

import { ApplicationErrors } from '@/modules/agents-v2/application/constants';

import { CoordinatorGraphBuilder } from './builders/coordinator-graph.builder';
import {
  GRAPH_CONFIG,
  GRAPH_NODES,
  LOG_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants/graph-constants';
import {
  CoordinatorAgentInput,
  CoordinatorAgentOutput,
  CoordinatorAgentSuccessOutput,
} from './types/coordinator-agent.types';
import { CoordinatorStateHelper, CoordinatorStateType } from './types/graph-state.types';

export interface ICoordinatorAgentService {
  run(input: CoordinatorAgentInput): Promise<CoordinatorAgentOutput>;
}

@Injectable()
export class CoordinatorAgentService implements ICoordinatorAgentService, OnModuleInit {
  private readonly logger = new Logger(CoordinatorAgentService.name);

  private graph: ReturnType<typeof StateGraph.prototype.compile>;

  constructor(private readonly graphBuilder: CoordinatorGraphBuilder) {}

  onModuleInit(): void {
    this.initializeGraph();
  }

  async run(input: CoordinatorAgentInput): Promise<CoordinatorAgentOutput> {
    try {
      this.logger.log(LOG_MESSAGES.PROCESSING_REQUEST(input.message));

      const result = await this.executeGraph(input);

      return this.processGraphResult(result, input);
    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  private initializeGraph(): void {
    this.graph = this.graphBuilder.buildGraph();
    this.logger.log(LOG_MESSAGES.GRAPH_COMPILED);
  }

  private async executeGraph(input: CoordinatorAgentInput): Promise<CoordinatorStateType> {
    const initialState = this.createInitialState(input);

    const result = await this.graph.invoke(initialState, {
      configurable: {
        thread_id: input.chatSessionId || GRAPH_CONFIG.DEFAULT_THREAD_ID,
      },
    });

    return result as CoordinatorStateType;
  }

  private createInitialState(input: CoordinatorAgentInput): Partial<CoordinatorStateType> {
    return {
      messages: [],
      originalMessage: input.message,
      chatSessionId: input.chatSessionId,
      classifiedIntent: null,
      currentIntentIndex: 0,
      processedIntents: [],
      errors: [],
      currentNode: GRAPH_CONFIG.INITIAL_NODE,
      retryCount: 0,
      applicationResults: [],
      objectResults: [],
      isCompleted: false,
    };
  }

  private processGraphResult(
    result: CoordinatorStateType,
    input: CoordinatorAgentInput,
  ): CoordinatorAgentOutput {
    if (this.isSuccessfulExecution(result)) {
      return this.createSuccessResponse(result, input);
    } else {
      return this.createErrorResponse(result);
    }
  }

  private isSuccessfulExecution(result: CoordinatorStateType): boolean {
    return result.currentNode === GRAPH_NODES.HANDLE_SUCCESS && !!result.classifiedIntent;
  }

  private createSuccessResponse(
    result: CoordinatorStateType,
    input: CoordinatorAgentInput,
  ): CoordinatorAgentOutput {
    const baseResponse: CoordinatorAgentSuccessOutput = {
      success: true,
      message: SUCCESS_MESSAGES.INTENT_CLASSIFIED,
      data: {
        classifiedIntent: result.classifiedIntent!,
        originalMessage: input.message,
        chatSessionId: input.chatSessionId,
      },
    };

    // Include application results if available
    const latestApplicationResult = CoordinatorStateHelper.getLatestApplicationResult(result);
    if (latestApplicationResult) {
      return {
        success: true,
        message: 'Intent classified and application processed successfully',
        data: {
          ...baseResponse.data,
          applicationSpec: latestApplicationResult.applicationSpec,
          enrichedSpec: latestApplicationResult.enrichedSpec,
          executionResult: latestApplicationResult.executionResult,
          isCompleted: result.isCompleted,
        },
      } as CoordinatorAgentSuccessOutput;
    }

    return baseResponse;
  }

  private createErrorResponse(result: CoordinatorStateType): CoordinatorAgentOutput {
    const errorMessage =
      result.errors.length > 0
        ? result.errors.map((e) => e.errorMessage).join('; ')
        : ApplicationErrors.GENERATION_FAILED;

    return {
      success: false,
      message: SUCCESS_MESSAGES.CLASSIFICATION_FAILED,
      data: {
        error: errorMessage,
      },
    };
  }

  private handleExecutionError(error: unknown): CoordinatorAgentOutput {
    this.logger.error(LOG_MESSAGES.GRAPH_EXECUTION_FAILED, error);

    return {
      success: false,
      message: SUCCESS_MESSAGES.CLASSIFICATION_FAILED,
      data: {
        error: error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED,
      },
    };
  }
}
