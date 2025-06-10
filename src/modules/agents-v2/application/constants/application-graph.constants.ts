export const APPLICATION_GRAPH_NODES = {
  APP_UNDERSTANDING: 'app_understanding',
  APP_DESIGN: 'app_design',
  APP_EXECUTOR: 'app_executor',
  HANDLE_SUCCESS: 'handle_success',
  HANDLE_ERROR: 'handle_error',
  HANDLE_RETRY: 'handle_retry',
} as const;

export const APPLICATION_GRAPH_EDGES = {
  VALIDATE: 'validate',
  DESIGN: 'design',
  EXECUTE: 'execute',
  SUCCESS: 'success',
  ERROR: 'error',
  RETRY: 'retry',
} as const;

export const APPLICATION_OPERATIONS = {
  CREATE: 'create_application',
  UPDATE: 'update_application',
  DELETE: 'delete_application',
} as const;

export const APPLICATION_GRAPH_CONFIG = {
  MAX_RETRY_COUNT: 1,
  DEFAULT_THREAD_ID: 'application_default',
  INITIAL_NODE: APPLICATION_GRAPH_NODES.APP_UNDERSTANDING,
} as const;

export const APPLICATION_LOG_MESSAGES = {
  PROCESSING_REQUEST: (message: string) => `Processing application request: ${message}`,
  GRAPH_COMPILED: 'Application graph compiled successfully',
  STATE_ERROR: 'Error retrieving application graph state',
  GRAPH_EXECUTION_FAILED: 'Application graph execution failed',
  UNDERSTANDING_COMPLETED: 'Application understanding completed successfully',
  DESIGN_COMPLETED: 'Application design completed successfully',
  EXECUTION_COMPLETED: 'Application execution completed successfully',
  RETRY_ATTEMPT: (count: number) => `Application graph retry attempt: ${count}`,
} as const;

export const APPLICATION_SUCCESS_MESSAGES = {
  APP_CREATED: 'Application created successfully',
  APP_UPDATED: 'Application updated successfully',
  APP_DELETED: 'Application deleted successfully',
  PROCESSING_FAILED: 'Application processing failed',
  UNDERSTANDING_FAILED: 'Application understanding failed',
  DESIGN_FAILED: 'Application design failed',
  EXECUTION_FAILED: 'Application execution failed',
} as const;

export const APPLICATION_ERROR_MESSAGES = {
  INVALID_SPEC: 'Invalid application specification',
  MISSING_REQUIRED_FIELDS: 'Missing required fields in application specification',
  DESIGN_VALIDATION_FAILED: 'Application design validation failed',
  EXECUTION_FAILED: 'Application execution failed',
  UNKNOWN_ERROR: 'Unknown error occurred during application processing',
} as const;
