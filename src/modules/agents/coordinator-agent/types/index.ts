export interface BaseAgentResponse {
  toolCalls: ToolCall[];
  metadata: Record<string, unknown>;
}

export interface ToolCallArguments {
  name?: string;
  objName?: string;
  data?: {
    name: string;
    relationships?: Array<{
      targetObject: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ToolCall {
  order: number;
  toolCall: {
    functionName: string;
    arguments: ToolCallArguments;
  };
}
