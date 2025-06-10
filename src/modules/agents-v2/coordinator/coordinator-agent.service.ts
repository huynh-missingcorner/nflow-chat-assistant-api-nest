import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';

import { ApplicationErrors } from '@/modules/agents-v2/application/constants';

import { CoordinatorGraphBuilder } from './builders/coordinator-graph.builder';
import { GRAPH_CONFIG, LOG_MESSAGES } from './constants/graph-constants';
import { CoordinatorAgentInput, CoordinatorAgentOutput } from './types/coordinator-agent.types';
import { CoordinatorStateType } from './types/graph-state.types';

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
      originalMessage: input.message,
      chatSessionId: input.chatSessionId,
    };
  }

  private processGraphResult(
    result: CoordinatorStateType,
    input: CoordinatorAgentInput,
  ): CoordinatorAgentOutput {
    // Get the latest message content from the state
    const latestMessage = this.getLatestMessageContent(result);

    // Determine success based on completion status
    const isSuccess = result.isCompleted && !!result.classifiedIntent;

    if (isSuccess) {
      return {
        success: true,
        message: latestMessage,
        data: {
          classifiedIntent: result.classifiedIntent!,
          originalMessage: input.message,
          chatSessionId: input.chatSessionId,
          isCompleted: result.isCompleted,
        },
      };
    } else {
      return {
        success: false,
        message: latestMessage,
        data: {
          error: latestMessage,
        },
      };
    }
  }

  private getLatestMessageContent(result: CoordinatorStateType): string {
    const messages = result.messages || [];

    if (messages.length === 0) {
      return 'No response available';
    }

    // Get the last message and extract its content
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content;

    if (typeof content === 'string') {
      return content;
    }

    // Handle complex content types
    if (Array.isArray(content)) {
      return content
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join(' ');
    }

    return typeof content === 'object' ? JSON.stringify(content) : String(content);
  }

  private handleExecutionError(error: unknown): CoordinatorAgentOutput {
    this.logger.error(LOG_MESSAGES.GRAPH_EXECUTION_FAILED, error);

    const errorMessage =
      error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED;

    return {
      success: false,
      message: errorMessage,
      data: {
        error: errorMessage,
      },
    };
  }
}
