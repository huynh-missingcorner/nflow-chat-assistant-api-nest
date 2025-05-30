import {
  Response as OpenAIResponse,
  ResponseCreateParams,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from 'openai/resources/responses/responses.mjs';

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

export interface ChatCompletionError {
  error: OpenAIError;
  message: string;
}

export interface FunctionCallInputs {
  functionCalls?: ResponseFunctionToolCall[];
  functionCallOutputs?: ResponseInputItem.FunctionCallOutput[];
}

export interface ToolCallContent {
  toolCalls: Array<{
    functionName: string;
    arguments: Record<string, unknown>;
  }>;
}
