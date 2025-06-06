import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

import type { IntentDetails } from '@/modules/agents-v2/coordinator/types/subgraph-handler.types';

import type { ApiFormatParserInput } from '../tools/api-format-parser.tool';

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
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetObject: string;
  description?: string;
}

export interface DBDesignResult {
  valid: boolean;
  objectId?: string;
  conflicts?: string[];
  recommendations?: string[];
  nflowSchema?: unknown;
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
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
  createdEntities?: Record<string, string | string[]>;
  completedSteps?: Array<{
    type: 'create_object' | 'create_field';
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
