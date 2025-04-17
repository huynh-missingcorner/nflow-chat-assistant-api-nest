import { ToolCall } from '../../types';

export interface BaseAgentResponse {
  toolCalls: ToolCall[];
  memoryPatch?: any;
  clarification?: HITLRequest;
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

export interface HITLRequest {
  prompt: string;
  taskId: string;
  missing: string[];
}
