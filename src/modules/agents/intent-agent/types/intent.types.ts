import { GenerateApplicationParams } from '../../application-agent/types/application.types';
import { GenerateFlowsParams } from '../../flow-agent/types/flow.types';
import { GenerateLayoutsParams } from '../../layout-agent/types/layout.types';
import { GenerateObjectsParams } from '../../object-agent/types/object.types';

export interface ExtractIntentParams {
  message: string;
  chatContext?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface IntentTask {
  agent: 'ApplicationAgent' | 'ObjectAgent' | 'LayoutAgent' | 'FlowAgent';
  description: string;
  data:
    | GenerateApplicationParams
    | GenerateObjectsParams
    | GenerateLayoutsParams
    | GenerateFlowsParams;
  dependsOn?: ('ApplicationAgent' | 'ObjectAgent' | 'LayoutAgent' | 'FlowAgent')[];
}

export interface IntentPlan {
  summary: string;
  tasks: IntentTask[];
}

export interface IntentToolResponse {
  id: string;
  type: 'function';
  function: {
    name: 'create_intent_plan';
    arguments: string;
  };
}
