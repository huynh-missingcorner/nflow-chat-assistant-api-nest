export const OBJECT_GRAPH_NODES = {
  // Understanding nodes
  FIELD_UNDERSTANDING: 'field_understanding',
  OBJECT_UNDERSTANDING: 'object_understanding',

  // Planning nodes
  DB_DESIGN: 'db_design',
  TYPE_MAPPER: 'type_mapper',

  // Execution nodes
  OBJECT_EXECUTOR: 'object_executor',

  // Handler nodes
  HANDLE_SUCCESS: 'handle_success',
  HANDLE_ERROR: 'handle_error',
  HANDLE_RETRY: 'handle_retry',
} as const;

export const OBJECT_GRAPH_EDGES = {
  UNDERSTAND: 'understand',
  DESIGN: 'design',
  MAP_TYPES: 'map_types',
  EXECUTE: 'execute',
  SUCCESS: 'success',
  ERROR: 'error',
  RETRY: 'retry',
} as const;

export const OBJECT_GRAPH_CONFIG = {
  MAX_RETRY_COUNT: 3,
  DEFAULT_THREAD_ID: 'object_default',
  INITIAL_NODE: OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING,
} as const;

export const OBJECT_LOG_MESSAGES = {
  PROCESSING_REQUEST: (message: string) => `Processing object request: ${message}`,
  GRAPH_COMPILED: 'Object graph compiled successfully',
  STATE_ERROR: 'Error retrieving object graph state',
  GRAPH_EXECUTION_FAILED: 'Object graph execution failed',
  FIELD_UNDERSTANDING_COMPLETED: 'Field understanding completed successfully',
  OBJECT_UNDERSTANDING_COMPLETED: 'Object understanding completed successfully',
  DB_DESIGN_COMPLETED: 'DB design completed successfully',
  TYPE_MAPPING_COMPLETED: 'Type mapping completed successfully',
  EXECUTION_COMPLETED: 'Object execution completed successfully',
  RETRY_ATTEMPT: (count: number) => `Object graph retry attempt: ${count}`,
  WORKFLOW_COMPLETED: 'Object graph completed successfully',
  WORKFLOW_FAILED: (error: string) => `Object graph execution failed: ${error}`,
} as const;

export const OBJECT_SUCCESS_MESSAGES = {
  OBJECT_CREATED: 'Object created successfully',
  FIELD_ADDED: 'Field added successfully',
  PROCESSING_FAILED: 'Object processing failed',
} as const;
