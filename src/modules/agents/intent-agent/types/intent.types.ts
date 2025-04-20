import { ApplicationAgentInput } from '../../application-agent/types/application.types';
import { FlowAgentInput } from '../../flow-agent/types/flow.types';
import { LayoutAgentInput } from '../../layout-agent/types/layout.types';
import { ObjectAgentInput } from '../../object-agent/types/object.types';
import { Agent } from '../../types';

export interface IntentPlan {
  summary: string;
  tasks: IntentTask[];
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
  sessionId: string;
}

export interface IntentToolResponse {
  id: string;
  type: 'function';
  function: {
    name: 'create_intent_plan';
    arguments: string;
  };
}
