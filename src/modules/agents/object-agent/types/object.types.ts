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
  objects: string[];
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
}

export interface GenerateObjectsResponse {
  toolCalls: ObjectToolCall[];
  metadata?: {
    totalObjects?: number;
    generatedAt?: string;
    schemas?: ObjectSchema[];
    additionalInfo?: Record<string, unknown>;
  };
}

/**
 * Represents a field in an object schema
 */
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

/**
 * Represents a complete object schema design
 */
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
