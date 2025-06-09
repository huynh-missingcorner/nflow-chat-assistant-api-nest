import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

import {
  ApplicationExecutionResult,
  ApplicationSpec,
  EnrichedApplicationSpec,
} from '@/modules/agents-v2/application/types/application-graph-state.types';
import { IntentClassifierOutput } from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';
import { ObjectExecutionResult } from '@/modules/agents-v2/object/types/object-graph-state.types';

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
  errors: Annotation<IntentError[]>({
    default: () => [],
    reducer: (x, y) => [...x, ...y],
  }),
  currentNode: Annotation<string>({
    default: () => 'start',
    reducer: (x, y) => y ?? x,
  }),
  retryCount: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => y ?? x,
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
    reducer: (x, y) => y ?? x,
  }),
});

export type CoordinatorStateType = typeof CoordinatorState.State;

// Helper functions to access the latest results (for backwards compatibility)
export class CoordinatorStateHelper {
  /**
   * Get the latest application execution result
   */
  static getLatestApplicationResult(
    state: CoordinatorStateType,
  ): ApplicationIntentResult['result'] | null {
    const results = state.applicationResults || [];
    const latestResult = results[results.length - 1];
    return latestResult?.result || null;
  }

  /**
   * Get application result for a specific intent
   */
  static getApplicationResultForIntent(
    state: CoordinatorStateType,
    intentId: string,
  ): ApplicationIntentResult | null {
    const results = state.applicationResults || [];
    return results.find((result) => result.intentId === intentId) || null;
  }

  /**
   * Get object result for a specific intent
   */
  static getObjectResultForIntent(
    state: CoordinatorStateType,
    intentId: string,
  ): ObjectIntentResult | null {
    const results = state.objectResults || [];
    return results.find((result) => result.intentId === intentId) || null;
  }

  /**
   * Get all successful application results
   */
  static getSuccessfulApplicationResults(state: CoordinatorStateType): ApplicationIntentResult[] {
    const results = state.applicationResults || [];
    return results.filter((result) => result.status === 'success');
  }

  /**
   * Get all successful object results
   */
  static getSuccessfulObjectResults(state: CoordinatorStateType): ObjectIntentResult[] {
    const results = state.objectResults || [];
    return results.filter((result) => result.status === 'success');
  }

  /**
   * Get all object execution results for summarization
   */
  static getAllObjectExecutionResults(state: CoordinatorStateType): ObjectExecutionResult[] {
    const results = state.objectResults || [];
    return results
      .map((result) => result.result.executionResult)
      .filter((execResult): execResult is ObjectExecutionResult => execResult !== undefined);
  }
}

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

/**
 * Interface for subgraph state transformation
 * Defines how coordinator state is transformed to/from subgraph states
 */
export interface SubgraphStateTransformer<TSubgraphState> {
  /**
   * Transform coordinator state to subgraph input state
   */
  transformToSubgraphInput(coordinatorState: CoordinatorStateType): Partial<TSubgraphState>;

  /**
   * Transform subgraph output state back to coordinator state
   */
  transformFromSubgraphOutput(
    subgraphState: TSubgraphState,
    originalCoordinatorState: CoordinatorStateType,
  ): Partial<CoordinatorStateType>;
}

/**
 * Validation interface for subgraph execution
 */
export interface SubgraphExecutionValidator {
  /**
   * Validate state before subgraph execution
   */
  validatePreExecution(state: CoordinatorStateType): ValidationResult;

  /**
   * Validate state after subgraph execution
   */
  validatePostExecution(state: CoordinatorStateType): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration for subgraph execution
 */
export interface SubgraphExecutionConfig {
  timeout?: number;
  retryCount?: number;
  validateInput?: boolean;
  validateOutput?: boolean;
}
