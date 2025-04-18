import { ChatMessage, ToolCall } from 'src/modules/agents/types';
import { ExecutionResult } from 'src/modules/agents/executor-agent/types/executor.types';
import { HITLRequest } from 'src/modules/agents/types';
import { IntentPlan } from 'src/modules/agents/intent-agent/types/intent.types';

export interface ShortTermMemory {
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

export interface CreatedApplication {
  id: string;
  name: string;
  description?: string;
  slug: string;
}

export interface Field {
  id?: string;
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  enumValues?: string[];
  relation?: {
    targetObject: string;
    type: string;
  };
}

export interface CreatedObject {
  objectId: string;
  name: string;
  fields: Field[];
}

export interface CreatedLayout {
  layoutId: string;
  name: string;
  pages: string[];
}

export interface CreatedFlow {
  flowId: string;
  name: string;
  trigger: string;
  actions: any[];
}
