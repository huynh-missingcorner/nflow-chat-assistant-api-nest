export interface ObjectParams {
  name: string;
  description: string;
  requiredFields: string[];
}

export interface GenerateObjectsParams {
  action: 'create' | 'update' | 'remove' | 'recover';
  objects: ObjectParams[];
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
