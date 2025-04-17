import { AgentAction, AgentType } from '../../types';

export interface LayoutAgentInput {
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

export interface LayoutAgentOutput {
  toolCalls: LayoutToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}
