import { ChatMessage } from 'src/modules/agents/types';

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

export interface SessionContext {
  sessionId: string;
  chatHistory: ChatMessage[];
  application?: CreatedApplication;
  createdObjects: CreatedObject[];
  createdLayouts: CreatedLayout[];
  createdFlows: CreatedFlow[];
  toolCallsLog: any[];
  taskResults: Record<string, any>;
  timestamp: Date;
}
