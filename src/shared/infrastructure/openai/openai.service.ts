import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenAIConfig, createOpenAIConfig } from './openai.config';
import {
  OpenAIError,
  ChatCompletionResponse,
  ChatCompletionError,
  ResponseCreateOptions,
  ChatMessage,
  OpenAIResponseWithRequestId,
} from './openai.types';
import {
  ResponseCreateParamsNonStreaming,
  Tool,
  ToolChoiceFunction,
  ToolChoiceOptions,
  ToolChoiceTypes,
} from 'openai/resources/responses/responses.mjs';

@Injectable()
export class OpenAIService implements OnModuleInit {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private config: OpenAIConfig;

  onModuleInit(): void {
    try {
      this.config = createOpenAIConfig();
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize OpenAI service: ${message}`);
      throw new Error(`Failed to initialize OpenAI service: ${message}`);
    }
  }

  /**
   * Creates a chat completion request with the provided messages and options
   * @param messages Array of messages to send to OpenAI
   * @param options Optional configuration including response format and other settings
   * @returns Promise with the chat completion response
   */
  async generateChatCompletion(
    messages: ChatMessage[],
    options?: ResponseCreateOptions,
  ): Promise<ChatCompletionResponse> {
    try {
      const params = this.createRequestParams(messages, options);
      const response: OpenAIResponseWithRequestId = await this.openai.responses.create(params);
      return this.processResponse(response);
    } catch (error: unknown) {
      const errorResponse = this.handleError(error);
      this.logger.error('Chat completion failed', errorResponse);
      throw new Error(errorResponse.message);
    }
  }

  /**
   * Creates a chat completion with function calling capability
   * @param messages Array of messages to send to OpenAI
   * @param options Configuration including tools and tool choice
   * @returns Promise with the chat completion response
   */
  async generateFunctionCompletion(
    messages: ChatMessage[],
    options: ResponseCreateOptions & {
      tool_choice: ToolChoiceOptions | ToolChoiceTypes | ToolChoiceFunction;
      tools: Array<Tool>;
    },
  ): Promise<ChatCompletionResponse> {
    try {
      const params = this.createRequestParams(messages, {
        ...options,
        tool_choice: options.tool_choice ?? 'auto',
        tools: options.tools,
      });
      const response: OpenAIResponseWithRequestId = await this.openai.responses.create(params);
      return this.processResponse(response);
    } catch (error: unknown) {
      const errorResponse = this.handleError(error);
      this.logger.error('Function completion failed', errorResponse);
      throw new Error(errorResponse.message);
    }
  }

  /**
   * Creates the request parameters by merging default config with provided options
   * @param messages Array of messages to send to OpenAI
   * @param instructions Optional instructions to send to OpenAI
   * @param options Optional configuration to override defaults
   * @returns Complete request parameters
   */
  private createRequestParams(
    messages: ChatMessage[],
    options?: ResponseCreateOptions,
  ): ResponseCreateParamsNonStreaming {
    return {
      ...options,
      input: messages,
      model: options?.model ?? this.config.defaultModel,
      max_output_tokens: options?.max_output_tokens ?? this.config.defaultMaxTokens,
      temperature: options?.temperature ?? this.config.defaultTemperature,
      stream: false,
    };
  }

  /**
   * Processes the OpenAI API response
   * @param response Raw API response
   * @returns Processed chat completion response
   */
  private processResponse(response: OpenAIResponseWithRequestId): ChatCompletionResponse {
    if (!response.output || response.output.length === 0) {
      throw new Error('No response from OpenAI');
    }

    // Handle message type outputs
    const messageOutput = response.output.find((item) => item.type === 'message');
    if (messageOutput) {
      return {
        content:
          messageOutput.content[0]?.type === 'output_text' ? messageOutput.content[0].text : '',
      };
    }

    // Handle function call outputs
    const functionCalls = response.output
      .filter((item) => item.type === 'function_call')
      .map((item) => ({
        id: item.id ?? '',
        type: 'function' as const,
        function: {
          call_id: item.call_id ?? '',
          name: item.name ?? '',
          arguments: item.arguments ?? '',
        },
      }));

    if (functionCalls.length > 0) {
      return {
        content: '',
        toolCalls: functionCalls,
      };
    }

    return {
      content: '',
      toolCalls: [],
    };
  }

  /**
   * Handles errors from the OpenAI API
   * @param error Raw error from the API
   * @returns Structured error response
   */
  private handleError(error: unknown): ChatCompletionError {
    if (error instanceof Error) {
      const apiError = error as OpenAIError;
      if (apiError.response) {
        return {
          error: apiError,
          message: `OpenAI API Error: ${apiError.response.status} - ${apiError.response.data.error.message}`,
        };
      }
      return {
        error: apiError,
        message: apiError.message,
      };
    }
    return {
      error: new Error('Unknown error'),
      message: 'An unexpected error occurred',
    };
  }
}
