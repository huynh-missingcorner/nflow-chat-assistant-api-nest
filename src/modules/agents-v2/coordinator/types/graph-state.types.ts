import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

import {
  ApplicationExecutionResult,
  ApplicationSpec,
  EnrichedApplicationSpec,
} from '@/modules/agents-v2/application/types/application-graph-state.types';
import { IntentClassifierOutput } from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';

// Define the state schema for the coordinator graph
// This now shares keys with the application state to enable direct subgraph integration
export const CoordinatorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  originalMessage: Annotation<string>(),
  chatSessionId: Annotation<string>(),
  classifiedIntent: Annotation<IntentClassifierOutput | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  currentIntentIndex: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => y ?? x,
  }),
  processedIntents: Annotation<number[]>({
    default: () => [],
    reducer: (x, y) => [...new Set([...x, ...y])],
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
  // Shared keys with application state for direct subgraph integration
  applicationSpec: Annotation<ApplicationSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  enrichedSpec: Annotation<EnrichedApplicationSpec | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  executionResult: Annotation<ApplicationExecutionResult | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  isCompleted: Annotation<boolean>({
    default: () => false,
    reducer: (x, y) => y ?? x,
  }),
});

export type CoordinatorStateType = typeof CoordinatorState.State;

export interface GraphNodeResult {
  success: boolean;
  data?: Partial<CoordinatorStateType>;
  error?: string;
}

export interface DomainIntentCombination {
  domain: string;
  intent: string;
}

export interface GraphConfiguration {
  maxRetryCount: number;
  defaultThreadId: string;
  initialNode: string;
}

export interface NodeExecutionContext {
  state: CoordinatorStateType;
  config?: GraphConfiguration;
}
