export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json'
  | 'array'
  | 'reference';

export interface ObjectField {
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  validation?: {
    type: string;
    params: Record<string, unknown>;
  };
  reference?: {
    object: string;
    field: string;
    onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
  };
}

export interface ObjectDefinition {
  name: string;
  description: string;
  fields: ObjectField[];
  indexes?: Array<{
    fields: string[];
    type: 'unique' | 'index';
  }>;
  permissions?: {
    create?: string[];
    read?: string[];
    update?: string[];
    delete?: string[];
  };
}

export interface GenerateObjectsParams {
  action: 'create' | 'update' | 'remove' | 'recover';
  objects: (string | ObjectDefinition)[];
}

export interface ObjectPayload {
  method: 'POST';
  endpoint: '/v1/objects';
  payload: {
    applicationId: string;
    objects: ObjectDefinition[];
  };
}

export interface ToolCallPayload {
  functionName: string;
  arguments: Record<string, unknown>;
}

export interface ObjectToolCall {
  order: number;
  toolCall: ToolCallPayload;
  dependsOn?: string[]; // Names of functions this call depends on
}

export interface GenerateObjectsResponse {
  toolCalls: ObjectToolCall[];
  metadata?: {
    appUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
}
