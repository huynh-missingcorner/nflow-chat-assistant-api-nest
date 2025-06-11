import { BaseMessage } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';

import {
  ApplicationExecutionResult,
  ApplicationSpec,
  EnrichedApplicationSpec,
} from '@/modules/agents-v2/application/types/application-graph-state.types';
import { IntentClassifierOutput } from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';
import { ObjectExecutionResult } from '@/modules/agents-v2/object/types/object-graph-state.types';

// Special reset marker
export const RESET_MARKER = Symbol('RESET_COORDINATOR_STATE');

// Interface for intent-specific errors
export interface IntentError {
  intentId: string;
  errorMessage: string;
  timestamp: string;
  retryCount: number;
}

// Interface for storing execution results with intent context
export interface IntentExecutionResult<T = any> {
  intentId: string;
  intentIndex: number;
  timestamp: string;
  result: T;
  status: 'success' | 'partial' | 'failed';
  domain: string;
}

// Application execution result with intent context
export interface ApplicationIntentResult
  extends IntentExecutionResult<{
    applicationSpec: ApplicationSpec | null;
    enrichedSpec: EnrichedApplicationSpec | null;
    executionResult: ApplicationExecutionResult | null;
  }> {
  domain: 'application';
}

// Object execution result with intent context - simplified to only track high-level status and execution results
export interface ObjectIntentResult
  extends IntentExecutionResult<{
    objectName?: string; // High-level identifier of what was created
    summary?: string; // Human-readable summary of what was accomplished
    entitiesCreated?: {
      objectCount: number;
      fieldCount: number;
    };
    // Keep only execution result for summarization - no internal design/planning state
    executionResult?: ObjectExecutionResult;
  }> {
  domain: 'object';
}

// Define the state schema for the coordinator graph
// This now shares keys with both application and object states to enable direct subgraph integration
export const CoordinatorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  originalMessage: Annotation<string>(),
  chatSessionId: Annotation<string>(),
  classifiedIntent: Annotation<IntentClassifierOutput | null>({
    default: () => null,
    reducer: (x, y) => {
      if ((y as any) === RESET_MARKER) {
        return null;
      }
      return y ?? x;
    },
  }),
  currentIntentIndex: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => {
      if ((y as any) === RESET_MARKER) {
        return 0;
      }
      return y ?? x;
    },
  }),
  processedIntents: Annotation<number[]>({
    default: () => [],
    reducer: (x, y) => {
      if (Array.isArray(y) && y.length === 1 && (y[0] as any) === RESET_MARKER) {
        return [];
      }
      return [...new Set([...x, ...y])];
    },
  }),
  errors: Annotation<IntentError[]>({
    default: () => [],
    reducer: (x, y) => {
      if (Array.isArray(y) && y.length === 1 && (y[0] as any) === RESET_MARKER) {
        return [];
      }
      return [...x, ...y];
    },
  }),
  currentNode: Annotation<string>({
    default: () => 'start',
    reducer: (x, y) => y ?? x,
  }),
  retryCount: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => {
      if ((y as any) === RESET_MARKER) {
        return 0;
      }
      return y ?? x;
    },
  }),
  // Store execution results from all intents with context
  applicationResults: Annotation<ApplicationIntentResult[]>({
    default: () => [],
    reducer: (x, y) => [...x, ...y],
  }),
  objectResults: Annotation<ObjectIntentResult[]>({
    default: () => [],
    reducer: (x, y) => [...x, ...y],
  }),

  isCompleted: Annotation<boolean>({
    default: () => false,
    reducer: (x, y) => {
      if ((y as any) === RESET_MARKER) {
        return false;
      }
      return y ?? x;
    },
  }),
});

export type CoordinatorStateType = typeof CoordinatorState.State;

export interface DomainIntentCombination {
  domain: string;
  intent: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
