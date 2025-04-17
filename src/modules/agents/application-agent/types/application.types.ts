import { AgentAction, AgentType } from '../../types';

export interface ApplicationAgentInput {
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

export interface ApplicationAgentOutput {
  toolCalls: ApplicationToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}
