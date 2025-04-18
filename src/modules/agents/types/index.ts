import { ShortTermMemory } from 'src/modules/memory/types';
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
  context?: ShortTermMemory;
}

export interface AgentOutput {
  toolCalls: ToolCall[];
  memoryPatch?: Partial<ShortTermMemory>;
  clarification?: HITLRequest;
  error?: string;
}

export interface ToolCall {
  id: string;
  functionName: string;
  arguments: Record<string, unknown>;
  order?: number;
}

export interface HITLRequest {
  prompt: string;
  taskId: string;
  missing: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
}
