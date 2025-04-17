import { CreatedApplication } from 'src/modules/memory/types';
import { CreatedFlow, CreatedLayout } from 'src/modules/memory/types';
import { CreatedObject } from 'src/modules/memory/types';
import { ExecutionResult } from '../executor-agent/types/executor.types';
import { IntentPlan } from '../intent-agent/types/intent.types';
import { ApplicationAgentInput } from '../application-agent/types/application.types';
import { FlowAgentInput } from '../flow-agent/types/flow.types';
import { LayoutAgentInput } from '../layout-agent/types/layout.types';
import { ObjectAgentInput } from '../object-agent/types/object.types';

export type AgentType = 'application' | 'object' | 'layout' | 'flow' | 'coordinator' | 'executor';

export type AgentAction = 'create' | 'update' | 'remove' | 'recover' | 'read';

export enum Agent {
  ApplicationAgent = 'ApplicationAgent',
  ObjectAgent = 'ObjectAgent',
  LayoutAgent = 'LayoutAgent',
  FlowAgent = 'FlowAgent',
}

export const AGENT_LIST = [
  Agent.ApplicationAgent,
  Agent.ObjectAgent,
  Agent.LayoutAgent,
  Agent.FlowAgent,
] as const;

export interface AgentInput<
  T extends ApplicationAgentInput | FlowAgentInput | LayoutAgentInput | ObjectAgentInput,
> {
  taskData: T;
  context?: SessionContext;
}

export interface AgentOutput {
  toolCalls: ToolCall[];
  memoryPatch?: Partial<SessionContext>;
  clarification?: HITLRequest;
  error?: string;
}

export interface ToolCall {
  id: string;
  functionName: string;
  arguments: Record<string, unknown>;
  order?: number;
}

export interface ToolCallArguments {
  [key: string]: unknown;
  name?: string;
  data?: {
    name: string;
    relationships?: Array<{
      targetObject: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  objName?: string;
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
  createdApplication?: CreatedApplication;
  createdObjects: CreatedObject[];
  createdLayouts: CreatedLayout[];
  createdFlows: CreatedFlow[];

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
