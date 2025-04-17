import { AgentAction, AgentType } from '../../types';

export interface GenerateApplicationParams {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  visibility: 'public' | 'private';
  slug: string;
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
