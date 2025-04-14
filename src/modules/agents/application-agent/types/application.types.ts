export interface GenerateApplicationParams {
  action: 'create' | 'update' | 'remove' | 'recover';
  name: string;
  description: string;
}

export interface ToolCallPayload {
  functionName: string;
  arguments: Record<string, unknown>;
}

export interface ApplicationToolCall {
  order: number;
  toolCall: ToolCallPayload;
  dependsOn?: string[]; // Names of functions this call depends on
}

export interface GenerateApplicationResponse {
  toolCalls: ApplicationToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}
