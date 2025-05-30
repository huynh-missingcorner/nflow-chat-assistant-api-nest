import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ResponseCreateParamsNonStreaming,
  ResponseOutputMessage,
  Tool,
  ToolChoiceFunction,
  ToolChoiceOptions,
  ToolChoiceTypes,
} from 'openai/resources/responses/responses.mjs';

import { createOpenAIConfig, OpenAIConfig } from './openai.config';
import {
  ChatCompletionError,
  ChatCompletionResponse,
  ChatMessage,
  FunctionCallInputs,
  OpenAIError,
  OpenAIResponseWithRequestId,
  ResponseCreateOptions,
  ToolCallContent,
} from './openai.types';

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
    functionCallInputs?: FunctionCallInputs,
  ): Promise<ChatCompletionResponse> {
    try {
      const params = this.createRequestParams(messages, options, functionCallInputs);
      this.logger.log('Sending chat completion request to OpenAI...');
      const response: OpenAIResponseWithRequestId = await this.openai.responses.create(params);
      this.logger.log(
        `Received response from OpenAI, model: ${response.model}, total tokens: ${response.usage?.total_tokens}`,
      );
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
    functionCallInputs?: FunctionCallInputs,
  ): Promise<ChatCompletionResponse> {
    try {
      const params = this.createRequestParams(
        messages,
        {
          ...options,
          tool_choice: options.tool_choice ?? 'auto',
          tools: options.tools,
        },
        functionCallInputs,
      );
      this.logger.log('Sending function completion request to OpenAI...');
      const response: OpenAIResponseWithRequestId = await this.openai.responses.create(params);
      this.logger.log(
        `Received response from OpenAI, model: ${response.model}, total tokens: ${response.usage?.total_tokens}`,
      );
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
    functionCallInputs?: FunctionCallInputs,
  ): ResponseCreateParamsNonStreaming {
    return {
      ...options,
      input: [
        ...messages,
        ...(functionCallInputs?.functionCalls ?? []),
        ...(functionCallInputs?.functionCallOutputs ?? []),
      ],
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

    const messageOutput = response.output.find((item) => item.type === 'message');
    if (messageOutput) {
      return this.processTextResponse(messageOutput);
    }

    return this.processFunctionCallResponse(response);
  }

  private processTextResponse(messageOutput: ResponseOutputMessage): ChatCompletionResponse {
    const messageContent =
      messageOutput.content[0]?.type === 'output_text' ? messageOutput.content[0].text : '';

    if (messageContent) {
      try {
        const parsedContent = JSON.parse(messageContent) as ToolCallContent;

        if (
          parsedContent &&
          Array.isArray(parsedContent.toolCalls) &&
          parsedContent.toolCalls.length > 0
        ) {
          this.logger.log('Detected tool calls in message content JSON');

          const toolCalls = parsedContent.toolCalls.map((toolCall, index: number) => ({
            id: `tool_call_${index}_${Date.now()}`,
            type: 'function' as const,
            function: {
              call_id: `call_${index}_${Date.now()}`,
              name: toolCall.functionName,
              arguments: JSON.stringify(toolCall.arguments),
            },
          }));

          return {
            content: '',
            toolCalls,
          };
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: unknown) {
        this.logger.debug(
          'Message content is not a valid JSON with toolCalls, treating as regular text',
        );
      }
    }

    return {
      content: messageContent,
    };
  }

  private processFunctionCallResponse(
    response: OpenAIResponseWithRequestId,
  ): ChatCompletionResponse {
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
