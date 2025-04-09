import { ResponseFormatJSONObject, ResponseFormatJSONSchema } from 'openai/resources/shared.mjs';
import { ResponseFormatText } from 'openai/resources/shared.mjs';
import { OpenAIConfig } from './openai.config';
import { ChatCompletionToolChoiceOption } from 'openai/resources/index.mjs';

export interface OpenAIError extends Error {
  response?: {
    status: number;
    data: {
      error: {
        message: string;
      };
    };
  };
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type JsonSchemaFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

export interface ChatCompletionOptions extends Partial<OpenAIConfig> {
  responseFormat?: JsonSchemaFormat;
  tools?: any[];
  tool_choice?: ChatCompletionToolChoiceOption;
  response_format?:
    | ResponseFormatText
    | ResponseFormatJSONSchema
    | ResponseFormatJSONObject
    | undefined;
}
