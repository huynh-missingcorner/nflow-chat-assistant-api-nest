import { FunctionCallInputs } from 'src/shared/infrastructure/openai/openai.types';
import { GenerateApplicationParams } from '../../application-agent/types/application.types';
import { GenerateFlowsParams } from '../../flow-agent/types/flow.types';
import { GenerateLayoutsParams } from '../../layout-agent/types/layout.types';
import { GenerateObjectsParams } from '../../object-agent/types/object.types';
import { ChatMessage } from '../../types';

export interface IntentPlan {
  summary: string;
  tasks: IntentTask[];
}

export interface IntentTask {
  id: string;
  agent: 'ApplicationAgent' | 'ObjectAgent' | 'LayoutAgent' | 'FlowAgent';
  description: string;
  dependsOn?: string[];
  data:
    | GenerateApplicationParams
    | GenerateFlowsParams
    | GenerateLayoutsParams
    | GenerateObjectsParams;
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

export interface ExtractIntentParams {
  message: string;
  chatContext?: Array<ChatMessage>;
  functionCallInputs?: FunctionCallInputs;
}

export interface IntentToolResponse {
  id: string;
  type: 'function';
  function: {
    name: 'create_intent_plan';
    arguments: string;
  };
}
