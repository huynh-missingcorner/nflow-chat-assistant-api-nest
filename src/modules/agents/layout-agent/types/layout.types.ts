import { AgentAction, AgentType } from '../../types';

export interface GenerateLayoutsParams {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  pages: string[];
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
