import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenAIConfig, createOpenAIConfig } from './openai.config';
import {
  ChatCompletionOptions,
  ChatMessage,
  OpenAIError,
  ChatCompletionResponse,
  ChatCompletionError,
} from './openai.types';
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessage,
} from 'openai/resources/chat/completions.mjs';

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
    options?: ChatCompletionOptions,
  ): Promise<ChatCompletionResponse> {
    try {
      const config = this.createRequestConfig(messages, options);
      const response = await this.openai.chat.completions.create(config);
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
    options: ChatCompletionOptions & { tools: NonNullable<ChatCompletionOptions['tools']> },
  ): Promise<ChatCompletionResponse> {
    try {
      const config = this.createRequestConfig(messages, {
        ...options,
        tool_choice: options.tool_choice ?? 'auto',
      });
      const response = await this.openai.chat.completions.create(config);
      return this.processResponse(response);
    } catch (error: unknown) {
      const errorResponse = this.handleError(error);
      this.logger.error('Function completion failed', errorResponse);
      throw new Error(errorResponse.message);
    }
  }

  /**
   * Creates the request configuration by merging default config with provided options
   * @param messages Array of messages to send to OpenAI
   * @param options Optional configuration to override defaults
   * @returns Complete request configuration
   */
  private createRequestConfig(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): ChatCompletionCreateParamsNonStreaming {
    const config = { ...this.config, ...options };
    return {
      model: config.model,
      messages: messages as ChatCompletionMessage[],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      ...(options?.response_format && { response_format: options.response_format }),
      ...(options?.tools && { tools: options.tools }),
      ...(options?.tool_choice && { tool_choice: options.tool_choice }),
      ...(options?.stop && { stop: options.stop }),
      ...(options?.presence_penalty && { presence_penalty: options.presence_penalty }),
      ...(options?.frequency_penalty && { frequency_penalty: options.frequency_penalty }),
      ...(options?.logit_bias && { logit_bias: options.logit_bias }),
      ...(options?.user && { user: options.user }),
    };
  }

  /**
   * Processes the OpenAI API response
   * @param response Raw API response
   * @returns Processed chat completion response
   */
  private processResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
  ): ChatCompletionResponse {
    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: message.content,
      toolCalls: message.tool_calls,
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
