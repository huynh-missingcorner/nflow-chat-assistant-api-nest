import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

import type { IntentDetails } from '@/modules/agents-v2/coordinator/types/subgraph-handler.types';

import {
  EXECUTION_STATUS,
  EXECUTION_STEP_TYPES,
  NFLOW_DATA_TYPES,
  RELATIONSHIP_TYPES,
} from '../constants/object-graph.constants';
import type { ApiFormatParserInput } from '../tools/api-format-parser.tool';

// Type definitions based on constants
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[keyof typeof RELATIONSHIP_TYPES];
export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];
export type ExecutionStepType = (typeof EXECUTION_STEP_TYPES)[keyof typeof EXECUTION_STEP_TYPES];
export type NflowDataType = (typeof NFLOW_DATA_TYPES)[keyof typeof NFLOW_DATA_TYPES];

export interface FieldSpec {
  name: string;
  typeHint: string;
  required?: boolean;
  description?: string;
  defaultValue?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ObjectSpec {
  objectName: string;
  description?: string;
  fields?: FieldSpec[];
  relationships?: ObjectRelationship[];
  metadata?: Record<string, unknown>;
}

export interface ObjectField {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: string[];
  validationRules?: string[];
}

export interface ObjectRelationship {
  type: RelationshipType;
  targetObject: string;
  description?: string;
}

// Define the structure of nflowSchema for type safety
export interface NflowSchemaResult {
  objectName: string;
  displayName: string;
  description?: string;
  fields: Array<{
    name: string;
    displayName: string;
    typeName: NflowDataType;
    required: boolean;
    subType?: string;
    description?: string;
    targetObject?: string;
    pickListOptions?: string[];
    defaultValue?: string;
  }>;
  designNotes?: string[];
  recommendations?: string[];
  priority?: number;
  dependencies?: string[];
}

export interface DBDesignResult {
  valid: boolean;
  objectId?: string;
  conflicts?: string[];
  recommendations?: string[];
  nflowSchema?: NflowSchemaResult;
}

// New interfaces for schema-level design
export interface SchemaSpec {
  schemaName: string;
  description?: string;
  objects: ObjectSpec[];
  globalRelationships?: SchemaRelationship[];
  metadata?: Record<string, unknown>;
}

export interface SchemaRelationship {
  fromObject: string;
  toObject: string;
  type: RelationshipType;
  description?: string;
  fieldMapping?: Record<string, string>;
}

export interface SchemaDesignResult {
  valid: boolean;
  schemaId?: string;
  conflicts?: string[];
  recommendations?: string[];
  objects: DBDesignResult[];
  totalObjects: number;
  processedObjects: number;
}

export interface SchemaExecutionResult {
  schemaId?: string;
  totalObjects: number;
  processedObjects: number;
  completedObjects: ObjectExecutionResult[];
  failedObjects: Array<{
    objectSpec: ObjectSpec;
    error: string;
  }>;
  status: ExecutionStatus;
  errors?: string[];
}

export interface TypeMappingResult {
  mappedFields: ObjectField[];
  errors?: string[];
  warnings?: string[];
  apiFormat?: ApiFormatParserInput;
}

export interface ObjectExecutionResult {
  objectId?: string;
  fieldIds?: string[];
  status: ExecutionStatus;
  errors?: string[];
  createdEntities?: Record<string, string | string[]>;
  completedSteps?: Array<{
    type: ExecutionStepType;
    stepIndex: number;
    entityId: string;
    entityName?: string;
  }>;
}

// Define the state schema for the object graph
export const ObjectState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  originalMessage: Annotation<string>(),
  chatSessionId: Annotation<string>(),
  intent: Annotation<IntentDetails | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  // Schema-level design fields
  schemaSpec: Annotation<SchemaSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  schemaDesignResult: Annotation<SchemaDesignResult | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  schemaExecutionResult: Annotation<SchemaExecutionResult | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  currentObjectIndex: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => y ?? x,
  }),
  isSchemaDesign: Annotation<boolean>({
    default: () => false,
    reducer: (x, y) => y ?? x,
  }),
  // Understanding phase
  fieldSpec: Annotation<FieldSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  objectSpec: Annotation<ObjectSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  // Planning phase
  dbDesignResult: Annotation<DBDesignResult | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  typeMappingResult: Annotation<TypeMappingResult | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  // Execution phase
  executionResult: Annotation<ObjectExecutionResult | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  error: Annotation<string | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  currentNode: Annotation<string>({
    default: () => 'start',
    reducer: (x, y) => y ?? x,
  }),
  retryCount: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => y ?? x,
  }),
  isCompleted: Annotation<boolean>({
    default: () => false,
    reducer: (x, y) => y ?? x,
  }),
});

export type ObjectStateType = typeof ObjectState.State;
