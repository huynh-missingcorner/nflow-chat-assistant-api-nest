import { AgentAction, AgentType } from '../../types';

export interface FlowTrigger {
  type: 'manual' | 'scheduled' | 'webhook';
  interval?: string;
  webhookUrl?: string;
}

export interface FlowAgentInput {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  trigger: FlowTrigger;
  actionLogic: string;
}

export interface ToolCallPayload {
  functionName: string;
  arguments: Record<string, unknown>;
}

export interface FlowToolCall {
  order: number;
  toolCall: ToolCallPayload;
  dependsOn?: string[];
}

export interface FlowAgentOutput {
  toolCalls: FlowToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}
