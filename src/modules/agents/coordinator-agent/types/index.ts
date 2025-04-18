import { AgentOutput, HITLRequest, ToolCall } from '../../types';

export interface BaseAgentResponse extends AgentOutput {
  toolCalls: ToolCall[];
  memoryPatch?: any;
  clarification?: HITLRequest;
}

export interface CoordinatorAgentInput {
  message: string;
  sessionId: string;
}

export interface CoordinatorAgentOutput {
  reply: string;
  requiresHITL?: boolean;
  hitlData?: {
    taskId: string;
    remainingTasks: any[];
  };
}
