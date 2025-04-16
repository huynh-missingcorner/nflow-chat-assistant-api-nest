import { ExecutionResult } from '../executor-agent/types/executor.types';
import { IntentPlan, IntentTask } from '../intent-agent/types/intent.types';

export interface AgentInput {
  task: IntentTask;
  context: SessionContext;
}

export interface AgentOutput {
  toolCalls: ToolCall[];
  memoryPatch?: any;
  clarification?: HITLRequest;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface HITLRequest {
  prompt: string;
  taskId: string;
  missing: string[];
}

export interface SessionContext {
  sessionId: string;

  // User messages (chat history)
  chatHistory: ChatMessage[];

  // Nflow memory
  //   application?: CreatedApplication;
  //   createdObjects: CreatedObject[];
  //   createdLayouts: CreatedLayout[];
  //   createdFlows: CreatedFlow[];

  // Plan memory
  intentPlan?: IntentPlan;
  toolCallsLog: ToolCall[];

  // Task mapping
  taskResults: Record<string, ExecutionResult>;

  // HITL status
  pendingClarifications: HITLRequest[];

  // Utility
  timestamp: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
}
