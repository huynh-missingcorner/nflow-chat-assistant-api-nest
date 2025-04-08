import { OpenAIConfig } from './openai.config';

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
}
