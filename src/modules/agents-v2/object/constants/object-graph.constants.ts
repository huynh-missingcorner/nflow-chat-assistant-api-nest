export const OBJECT_GRAPH_NODES = {
  OBJECT_UNDERSTANDING: 'object_understanding',
  OBJECT_DESIGN: 'object_design',
  OBJECT_EXECUTOR: 'object_executor',
  HANDLE_SUCCESS: 'handle_success',
  HANDLE_ERROR: 'handle_error',
  HANDLE_RETRY: 'handle_retry',
} as const;

export const OBJECT_GRAPH_EDGES = {
  VALIDATE: 'validate',
  DESIGN: 'design',
  EXECUTE: 'execute',
  SUCCESS: 'success',
  ERROR: 'error',
  RETRY: 'retry',
} as const;

export const OBJECT_GRAPH_CONFIG = {
  MAX_RETRY_COUNT: 3,
  DEFAULT_THREAD_ID: 'object_default',
  INITIAL_NODE: OBJECT_GRAPH_NODES.OBJECT_UNDERSTANDING,
} as const;

export const OBJECT_LOG_MESSAGES = {
  PROCESSING_REQUEST: (message: string) => `Processing object request: ${message}`,
  GRAPH_COMPILED: 'Object graph compiled successfully',
  STATE_ERROR: 'Error retrieving object graph state',
  GRAPH_EXECUTION_FAILED: 'Object graph execution failed',
  UNDERSTANDING_COMPLETED: 'Object understanding completed successfully',
  DESIGN_COMPLETED: 'Object design completed successfully',
  EXECUTION_COMPLETED: 'Object execution completed successfully',
  RETRY_ATTEMPT: (count: number) => `Object graph retry attempt: ${count}`,
  WORKFLOW_COMPLETED: 'Object graph completed successfully',
  WORKFLOW_FAILED: (error: string) => `Object graph execution failed: ${error}`,
} as const;
