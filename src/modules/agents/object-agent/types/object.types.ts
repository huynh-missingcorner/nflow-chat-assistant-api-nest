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
  features: string[];
  components: string[];
  applicationId: string;
  sessionId: string;
  messageId: string;
}

export interface ObjectPayload {
  method: 'POST';
  endpoint: '/v1/objects';
  payload: {
    applicationId: string;
    objects: ObjectDefinition[];
  };
}

export interface GenerateObjectsResponse {
  objectPayload: ObjectPayload;
  suggestedNextSteps: Array<{
    agent: 'layout' | 'flow';
    reason: string;
  }>;
}
