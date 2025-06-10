export const GRAPH_NODES = {
  // Nodes
  STATE_RESET: 'stateReset',
  CLASSIFY_INTENT: 'classifyIntent',
  VALIDATE_CLASSIFICATION: 'validateClassification',
  PROCESS_NEXT_INTENT: 'processNextIntent',

  // Subgraphs
  APPLICATION_SUBGRAPH: 'applicationSubgraph',
  OBJECT_SUBGRAPH: 'objectSubgraph',

  // Handlers
  HANDLE_SUCCESS: 'handleSuccess',
  HANDLE_ERROR: 'handleError',
  HANDLE_RETRY: 'handleRetry',

  // Summary
  SUMMARIZE_EXECUTION: 'summarizeExecution',
} as const;

export const GRAPH_EDGES = {
  VALIDATE: 'validate',
  ERROR: 'error',
  SUCCESS: 'success',
  RETRY: 'retry',
  NEXT_INTENT: 'nextIntent',
  APPLICATION_DOMAIN: 'applicationDomain',
  OBJECT_DOMAIN: 'objectDomain',
  SUMMARIZE: 'summarize',
} as const;

export const GRAPH_CONFIG = {
  MAX_RETRY_COUNT: 3,
  DEFAULT_THREAD_ID: 'default-session',
  INITIAL_NODE: 'start',
} as const;

export const VALIDATION_MESSAGES = {
  NO_CLASSIFIED_INTENT: 'No classified intent to validate',
  NO_INTENTS_ARRAY: 'No intents array in classified intent',
  EMPTY_INTENTS_ARRAY: 'Empty intents array in classified intent',
  MISSING_REQUIRED_FIELDS: 'Classification missing required fields: domain or intent',
  INVALID_COMBINATION: (domain: string, intent: string) =>
    `Invalid domain-intent combination: ${domain}-${intent}`,
  NO_TOOL_CALLS: 'No tool calls found in LLM response',
  UNKNOWN_CLASSIFICATION_ERROR: 'Unknown error in intent classification',
  UNKNOWN_VALIDATION_ERROR: 'Unknown validation error',
} as const;

export const LOG_MESSAGES = {
  GRAPH_COMPILED: 'Coordinator graph compiled successfully',
  PROCESSING_REQUEST: (message: string) => `Processing user request: ${message}`,
  CLASSIFYING_INTENT: (message: string) => `Classifying intent for message: ${message}`,
  INTENT_CLASSIFIED: 'Intent classified successfully',
  CLASSIFICATION_VALIDATED: 'Classification validated successfully',
  WORKFLOW_COMPLETED: 'Intent classification completed successfully',
  WORKFLOW_FAILED: (error: string) => `Coordinator workflow failed: ${error}`,
  RETRYING_CLASSIFICATION: (attempt: number) =>
    `Retrying intent classification (attempt ${attempt})`,
  GRAPH_EXECUTION_FAILED: 'Coordinator graph execution failed',
  STATE_ERROR: 'Error getting graph state',
  PROCESSING_INTENT: (index: number, total: number) => `Processing intent ${index + 1} of ${total}`,
  ALL_INTENTS_PROCESSED: 'All intents processed successfully',
  INTENT_DEPENDENCY_DETECTED: (dependent: number, dependsOn: number) =>
    `Intent ${dependent} depends on intent ${dependsOn}`,
} as const;

export const SUCCESS_MESSAGES = {
  INTENT_CLASSIFIED: 'User intent classified successfully',
  CLASSIFICATION_FAILED: 'Failed to classify user intent',
  MULTIPLE_INTENTS_CLASSIFIED: (count: number) => `Successfully classified ${count} user intents`,
} as const;

export const SUMMARIZER_MESSAGES = {
  STARTING_SUMMARY: 'Starting execution summary generation',
  SUMMARY_GENERATED: 'Execution summary generated successfully',
  SUMMARY_FAILED: 'Failed to generate execution summary',
  SUMMARY_ERROR_PREFIX: 'Execution Summary: ',
  SUMMARY_FALLBACK: 'Failed to generate execution summary due to an error.',
} as const;
