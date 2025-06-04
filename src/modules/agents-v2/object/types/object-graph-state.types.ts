import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export interface ObjectSpec {
  objectName: string;
  description?: string;
  fields?: ObjectField[];
  relationships?: ObjectRelationship[];
  metadata?: Record<string, unknown>;
}

export interface ObjectField {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
}

export interface ObjectRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetObject: string;
  description?: string;
}

export interface EnrichedObjectSpec extends ObjectSpec {
  objectId?: string;
  dependencies?: string[];
  validationRules?: string[];
}

export interface ObjectExecutionResult {
  objectId: string;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

// Define the state schema for the object graph
export const ObjectState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  originalMessage: Annotation<string>(),
  chatSessionId: Annotation<string>(),
  objectSpec: Annotation<ObjectSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  enrichedSpec: Annotation<EnrichedObjectSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
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
