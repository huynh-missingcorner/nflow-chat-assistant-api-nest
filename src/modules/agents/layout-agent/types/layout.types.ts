export interface GenerateLayoutsParams {
  action: 'create' | 'update' | 'remove' | 'recover';
  name: string;
  description: string;
}

export interface ToolCallPayload {
  functionName: string;
  arguments: Record<string, unknown>;
}

export interface LayoutToolCall {
  order: number;
  toolCall: ToolCallPayload;
  dependsOn?: string[];
}

export interface GenerateLayoutsResponse {
  toolCalls: LayoutToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}
