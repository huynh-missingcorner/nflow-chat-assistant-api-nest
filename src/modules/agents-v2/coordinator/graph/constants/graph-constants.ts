export const GRAPH_NODES = {
  CLASSIFY_INTENT: 'classifyIntent',
  VALIDATE_CLASSIFICATION: 'validateClassification',
  HANDLE_SUCCESS: 'handleSuccess',
  HANDLE_ERROR: 'handleError',
  HANDLE_RETRY: 'handleRetry',
} as const;

export const GRAPH_EDGES = {
  VALIDATE: 'validate',
  ERROR: 'error',
  SUCCESS: 'success',
  RETRY: 'retry',
} as const;

export const GRAPH_CONFIG = {
  MAX_RETRY_COUNT: 3,
  DEFAULT_THREAD_ID: 'default-session',
  INITIAL_NODE: 'start',
} as const;

export const VALIDATION_MESSAGES = {
  NO_CLASSIFIED_INTENT: 'No classified intent to validate',
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
} as const;

export const SUCCESS_MESSAGES = {
  INTENT_CLASSIFIED: 'User intent classified successfully',
  CLASSIFICATION_FAILED: 'Failed to classify user intent',
} as const;
