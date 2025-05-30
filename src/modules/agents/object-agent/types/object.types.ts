import { AgentAction, AgentType } from '@/modules/agents/types';

export interface ObjectParams {
  name: string;
  description: string;
  fields: ObjectField[];
}

export interface ObjectField {
  name: string;
  type: string;
  enumValues: string[];
  required: boolean;
}

export interface ObjectAgentInput {
  agentType: AgentType;
  action: AgentAction;
  objects: ObjectParams[];
}

export interface ObjectSchemaField {
  name: string;
  type: string;
  displayName: string;
  description: string;
  required: boolean;
  searchable: boolean;
  attributes?: {
    isUnique?: boolean;
    defaultValue?: unknown;
    validation?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface ObjectSchema {
  name: string;
  displayName: string;
  description: string;
  primaryField: string;
  fields: ObjectSchemaField[];
  relationships?: Array<{
    type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
    targetObject: string;
    fieldName: string;
    description: string;
  }>;
}
