import { ResponseFormatJSONObject, ResponseFormatJSONSchema } from 'openai/resources/shared.mjs';
import { ResponseFormatText } from 'openai/resources/shared.mjs';
import { OpenAIConfig } from './openai.config';
import { ChatCompletionToolChoiceOption, ChatCompletionTool } from 'openai/resources/index.mjs';
import {
  ResponseCreateParams,
  ResponseInputItem,
  ResponseOutputItem,
} from 'openai/resources/responses/responses.mjs';
import { Response as OpenAIResponse } from 'openai/resources/responses/responses.mjs';

export interface OpenAIError extends Error {
  response?: {
    status: number;
    data: {
      error: {
        message: string;
        type?: string;
        code?: string;
      };
    };
  };
}

export type ChatMessage = ResponseInputItem;

export type ResponseCreateOptions = Partial<Omit<ResponseCreateParams, 'input'>>;

export type OpenAIResponseWithRequestId = OpenAIResponse & {
  _request_id?: string | null;
};

export interface ChatCompletionResponse {
  content: string | null;
  toolCalls?: Array<ToolCallOutput>;
}

export interface ToolCallOutput {
  id: string;
  type: 'function';
  function: {
    call_id: string;
    name: string;
    arguments: string;
  };
}

export type OutputItemType = ResponseOutputItem['type'];

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

export interface ChatCompletionBaseOptions extends Partial<OpenAIConfig> {
  response_format?: ResponseFormatText | ResponseFormatJSONSchema | ResponseFormatJSONObject;
  stream?: boolean;
  seed?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}

export interface ChatCompletionWithToolsOptions extends ChatCompletionBaseOptions {
  tools: ChatCompletionTool[];
  tool_choice: ChatCompletionToolChoiceOption;
}

export interface ChatCompletionWithoutToolsOptions extends ChatCompletionBaseOptions {
  tools?: never;
  tool_choice?: never;
}

export type ChatCompletionOptions =
  | ChatCompletionWithToolsOptions
  | ChatCompletionWithoutToolsOptions;

export interface ChatCompletionError {
  error: OpenAIError;
  message: string;
}
