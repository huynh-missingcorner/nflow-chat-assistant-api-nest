import { Injectable, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenAIConfig, createOpenAIConfig } from './openai.config';
import { ChatCompletionOptions, ChatMessage, OpenAIError } from './openai.types';

@Injectable()
export class OpenAIService implements OnModuleInit {
  private openai: OpenAI;
  private config: OpenAIConfig;

  onModuleInit(): void {
    try {
      this.config = createOpenAIConfig();
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize OpenAI service: ${error.message}`);
      }
      throw new Error('Failed to initialize OpenAI service');
    }
  }

  /**
   * Sends a completion request to OpenAI's API
   * @param prompt The prompt to send to OpenAI
   * @param overrideConfig Optional configuration to override default settings
   * @returns The completion response from OpenAI
   */
  async generateCompletion(
    prompt: string,
    overrideConfig?: Partial<OpenAIConfig>,
  ): Promise<string> {
    const config = { ...this.config, ...overrideConfig };

    try {
      const response = await this.openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: unknown) {
      if (error instanceof Error) {
        const apiError = error as OpenAIError;
        if (apiError.response) {
          throw new Error(
            `OpenAI API Error: ${apiError.response.status} - ${apiError.response.data.error.message}`,
          );
        }
      }
      throw new Error('Failed to generate completion');
    }
  }

  /**
   * Sends a chat completion request to OpenAI's API with multiple messages
   * @param messages Array of messages to send to OpenAI
   * @param options Optional configuration including response format and other settings
   * @returns The chat completion response from OpenAI
   */
  async generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): Promise<string> {
    const config = { ...this.config, ...options };

    try {
      const requestBody = {
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        ...(options?.responseFormat && { response_format: options.responseFormat }),
        ...(options?.tools && { tools: options.tools }),
      };
      const response = await this.openai.chat.completions.create(requestBody);

      return response.choices[0]?.message?.content || '';
    } catch (error: unknown) {
      if (error instanceof Error) {
        const apiError = error as OpenAIError;
        if (apiError.response) {
          throw new Error(
            `OpenAI API Error: ${apiError.response.status} - ${apiError.response.data.error.message}`,
          );
        }
      }
      throw new Error('Failed to generate chat completion');
    }
  }
}
