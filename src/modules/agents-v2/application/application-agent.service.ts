import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';

import { ApplicationGraphBuilder } from './builders/application-graph.builder';
import { ApplicationErrors } from './constants';
import {
  APPLICATION_GRAPH_CONFIG,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
  APPLICATION_SUCCESS_MESSAGES,
} from './constants/application-graph.constants';
import { ApplicationAgentInput, ApplicationAgentOutput } from './types/application.types';
import { ApplicationStateType } from './types/application-graph-state.types';

export interface IApplicationAgentService {
  run(input: ApplicationAgentInput): Promise<ApplicationAgentOutput>;
}

@Injectable()
export class ApplicationAgentService implements IApplicationAgentService, OnModuleInit {
  private readonly logger = new Logger(ApplicationAgentService.name);

  private graph: ReturnType<typeof StateGraph.prototype.compile>;

  constructor(private readonly graphBuilder: ApplicationGraphBuilder) {}

  onModuleInit(): void {
    this.initializeGraph();
  }

  async run(input: ApplicationAgentInput): Promise<ApplicationAgentOutput> {
    try {
      this.logger.log(APPLICATION_LOG_MESSAGES.PROCESSING_REQUEST(input.message));

      const result = await this.executeGraph(input);

      return this.processGraphResult(result, input);
    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  private initializeGraph(): void {
    this.graph = this.graphBuilder.buildGraph();
    this.logger.log(APPLICATION_LOG_MESSAGES.GRAPH_COMPILED);
  }

  private async executeGraph(input: ApplicationAgentInput): Promise<ApplicationStateType> {
    const initialState = this.createInitialState(input);

    const result = await this.graph.invoke(initialState, {
      configurable: {
        thread_id: input.chatSessionId || APPLICATION_GRAPH_CONFIG.DEFAULT_THREAD_ID,
      },
    });

    return result as ApplicationStateType;
  }

  private createInitialState(input: ApplicationAgentInput): Partial<ApplicationStateType> {
    return {
      messages: [],
      originalMessage: input.message,
      chatSessionId: input.chatSessionId,
      applicationSpec: null,
      enrichedSpec: null,
      executionResult: null,
      error: null,
      currentNode: APPLICATION_GRAPH_CONFIG.INITIAL_NODE,
      retryCount: 0,
      isCompleted: false,
    };
  }

  private processGraphResult(
    result: ApplicationStateType,
    input: ApplicationAgentInput,
  ): ApplicationAgentOutput {
    if (this.isSuccessfulExecution(result)) {
      return this.createSuccessResponse(result, input);
    } else {
      return this.createErrorResponse(result);
    }
  }

  private isSuccessfulExecution(result: ApplicationStateType): boolean {
    return (
      result.currentNode === APPLICATION_GRAPH_NODES.HANDLE_SUCCESS &&
      !!result.executionResult &&
      result.executionResult.status === 'success'
    );
  }

  private createSuccessResponse(
    result: ApplicationStateType,
    input: ApplicationAgentInput,
  ): ApplicationAgentOutput {
    return {
      success: true,
      message: APPLICATION_SUCCESS_MESSAGES.APP_CREATED,
      data: {
        executionResult: result.executionResult!,
        originalMessage: input.message,
        chatSessionId: input.chatSessionId,
        applicationSpec: result.applicationSpec || null,
        enrichedSpec: result.enrichedSpec || null,
      },
    };
  }

  private createErrorResponse(result: ApplicationStateType): ApplicationAgentOutput {
    return {
      success: false,
      message: APPLICATION_SUCCESS_MESSAGES.PROCESSING_FAILED,
      data: {
        error: result.error || ApplicationErrors.GENERATION_FAILED,
        currentNode: result.currentNode,
        retryCount: result.retryCount,
      },
    };
  }

  private handleExecutionError(error: unknown): ApplicationAgentOutput {
    this.logger.error(APPLICATION_LOG_MESSAGES.GRAPH_EXECUTION_FAILED, error);

    return {
      success: false,
      message: APPLICATION_SUCCESS_MESSAGES.PROCESSING_FAILED,
      data: {
        error: error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED,
      },
    };
  }
}
