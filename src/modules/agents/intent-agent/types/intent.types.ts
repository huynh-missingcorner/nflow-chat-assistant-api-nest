import { ApplicationAgentInput } from '@/modules/agents/application-agent/types/application.types';
import { FlowAgentInput } from '@/modules/agents/flow-agent/types/flow.types';
import { LayoutAgentInput } from '@/modules/agents/layout-agent/types/layout.types';
import { ObjectAgentInput } from '@/modules/agents/object-agent/types/object.types';
import { Agent } from '@/modules/agents/types';

export interface IntentPlan {
  summary: string;
  tasks: IntentTask[];
  originalMessage?: string;
}

export interface IntentTask {
  id: string;
  agent: Agent;
  description: string;
  dependsOn?: string[];
  data: ApplicationAgentInput | FlowAgentInput | LayoutAgentInput | ObjectAgentInput;
}

export interface ObjectAgentData {
  agentType: 'object';
  action: 'create' | 'update' | 'delete' | 'read';
  objects: {
    name: string;
    description?: string;
    fields?: {
      name: string;
      type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'relation';
      required?: boolean;
      enumValues?: string[];
    }[];
  }[];
}

export interface IntentAgentInput {
  message: string;
  chatSessionId: string;
}

export interface IntentToolResponse {
  id: string;
  type: 'function';
  function: {
    name: 'create_intent_plan';
    arguments: string;
  };
}
