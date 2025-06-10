export const OBJECT_GRAPH_NODES = {
  // Understanding nodes
  FIELD_UNDERSTANDING: 'field_understanding',
  OBJECT_UNDERSTANDING: 'object_understanding',
  SCHEMA_UNDERSTANDING: 'schema_understanding',

  // Planning nodes
  DB_DESIGN: 'db_design',
  TYPE_MAPPER: 'type_mapper',

  // Execution nodes
  OBJECT_EXECUTOR: 'object_executor',
  FIELD_EXECUTOR: 'field_executor',
  SCHEMA_EXECUTOR: 'schema_executor',

  // Handler nodes
  HANDLE_SUCCESS: 'handle_success',
  HANDLE_ERROR: 'handle_error',
  HANDLE_RETRY: 'handle_retry',
} as const;

export const OBJECT_GRAPH_EDGES = {
  // Understanding routes
  FIELD_UNDERSTANDING: 'field_understanding',
  OBJECT_UNDERSTANDING: 'object_understanding',
  SCHEMA_UNDERSTANDING: 'schema_understanding',

  // Processing routes
  DB_DESIGN: 'db_design',
  TYPE_MAPPING: 'type_mapping',
  OBJECT_EXECUTION: 'object_execution',
  FIELD_EXECUTION: 'field_execution',
  SCHEMA_EXECUTION: 'schema_execution',

  // Terminal routes
  SUCCESS: 'success',
  ERROR: 'error',
  RETRY: 'retry',
} as const;

// Execution Status Constants
export const EXECUTION_STATUS = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

// Relationship Type Constants
export const RELATIONSHIP_TYPES = {
  ONE_TO_ONE: 'one-to-one',
  ONE_TO_MANY: 'one-to-many',
  MANY_TO_MANY: 'many-to-many',
} as const;

// Nflow Data Type Constants
export const NFLOW_DATA_TYPES = {
  NUMERIC: 'numeric',
  TEXT: 'text',
  DATE_TIME: 'dateTime',
  BOOLEAN: 'boolean',
  PICK_LIST: 'pickList',
  JSON: 'json',
  GENERATED: 'generated',
  CURRENCY: 'currency',
  EXTERNAL_RELATION: 'externalRelation',
  RELATION: 'relation',
  OBJECT_REFERENCE: 'objectReference',
  FLOW_REFERENCE: 'flowReference',
  ROLLUP: 'rollup',
  FILE: 'file',
} as const;

// Nflow Data Type Subtypes
export const NFLOW_SUBTYPES = {
  TEXT: {
    SHORT: 'short',
    LONG: 'long',
    RICH: 'rich',
  },
  NUMERIC: {
    INTEGER: 'integer',
    FLOAT: 'float',
  },
  DATE_TIME: {
    DATE_TIME: 'date-time',
    DATE: 'date',
    TIME: 'time',
  },
  PICK_LIST: {
    SINGLE: 'single',
    MULTIPLE: 'multiple',
  },
} as const;

// Object Web Development (OWD) Constants
export const OWD_TYPES = {
  PUBLIC_READ: 'PublicRead',
  PUBLIC_READ_WRITE: 'PublicReadWrite',
  PRIVATE: 'Private',
} as const;

// Execution Step Types
export const EXECUTION_STEP_TYPES = {
  CREATE_OBJECT: 'create_object',
  CREATE_FIELD: 'create_field',
  UPDATE_FIELD: 'update_field',
  DELETE_FIELD: 'delete_field',
  RECOVER_FIELD: 'recover_field',
} as const;

// Auto-generated field names that should be excluded
export const AUTO_GENERATED_FIELDS = {
  GUID: 'guid',
  CURRENCY_CODE: 'currencyCode',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  CREATED_BY: 'createdBy',
  MANAGED_BY: 'managedBy',
} as const;

export const OBJECT_GRAPH_CONFIG = {
  MAX_RETRY_COUNT: 1,
  DEFAULT_THREAD_ID: 'object_default',
  INITIAL_NODE: OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING,
  DEFAULT_SCHEMA_PRIORITY: 5,
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 10,
} as const;

// Message Templates
export const MESSAGE_TEMPLATES = {
  PROCESSING_REQUEST: (message: string) => `Processing object request: ${message}`,
  GRAPH_COMPILED: 'Object graph compiled successfully',
  STATE_ERROR: 'Error retrieving object graph state',
  GRAPH_EXECUTION_FAILED: 'Object graph execution failed',
  RETRY_ATTEMPT: (count: number) => `Object graph retry attempt: ${count}`,
  WORKFLOW_COMPLETED: 'Object graph completed successfully',
  WORKFLOW_FAILED: (error: string) => `Object graph execution failed: ${error}`,

  // Understanding phase messages
  FIELD_UNDERSTANDING_COMPLETED: 'Field understanding completed successfully',
  OBJECT_UNDERSTANDING_COMPLETED: 'Object understanding completed successfully',
  SCHEMA_UNDERSTANDING_STARTED: 'Schema understanding started',
  SCHEMA_UNDERSTANDING_COMPLETED: 'Schema understanding completed successfully',

  // Design phase messages
  DB_DESIGN_COMPLETED: 'DB design completed successfully',
  TYPE_MAPPING_COMPLETED: 'Type mapping completed successfully',

  // Execution phase messages
  EXECUTION_COMPLETED: 'Object execution completed successfully',
  FIELD_EXECUTION_COMPLETED: 'Field execution completed successfully',
  SCHEMA_EXECUTION_STARTED: 'Schema execution started',
  SCHEMA_EXECUTION_COMPLETED: 'Schema execution completed successfully',

  // Routing messages
  DESIGN_DATA_SCHEMA_ROUTING: 'Design data schema intent - routing to schema understanding',
  SINGLE_OBJECT_ROUTING: 'Single object intent - routing to object understanding',
  FIELD_MANIPULATION_CREATE_ROUTING:
    'Field manipulation with creation - routing to field understanding',
  FIELD_MANIPULATION_ROUTING:
    'Field manipulation without creation - routing to object understanding',
  DELETE_OBJECT_ROUTING: 'Delete object intent - routing directly to execution',
  UNDERSTANDING_COMPLETED_ROUTING: 'Understanding completed successfully, routing to DB design',
  SCHEMA_DESIGN_COMPLETED_ROUTING: 'Schema design completed, routing to schema execution',
  OBJECT_DESIGN_COMPLETED_ROUTING: 'Object design completed, routing to type mapping',
  TYPE_MAPPING_COMPLETED_ROUTING: 'Type mapping completed, routing to object execution',

  // Schema execution messages
  SCHEMA_EXECUTION_START: (totalObjects: number) =>
    `Starting schema execution for ${totalObjects} objects`,
  PROCESSING_OBJECT: (objectName: string) => `Processing object: ${objectName}`,
  OBJECT_CREATED_SUCCESS: (objectName: string) => `Successfully created object: ${objectName}`,
  OBJECT_CREATION_FAILED: (objectName: string) => `Failed to create object ${objectName}:`,
  SCHEMA_EXECUTION_SUMMARY: (completed: number, total: number) =>
    `Schema execution completed: ${completed}/${total} objects created successfully`,

  // Retry messages
  RETRY_WITH_COMPLETED_STEPS: 'Retrying with completed steps, going directly to object execution',
  SCHEMA_EXECUTION_RETRY: 'Schema execution retry, restarting from field understanding',
  OBJECT_EXECUTION_RETRY: 'Object execution retry, restarting from field understanding',
} as const;

// Error Message Templates
export const ERROR_TEMPLATES = {
  NO_INTENT_FOUND: 'No intent found in state, defaulting to error',
  UNKNOWN_INTENT_ACTION: (action: string) =>
    `Unknown intent action: ${action}, defaulting to field understanding`,
  NO_SPEC_EXTRACTED: 'No spec extracted during understanding phase, routing to retry',
  NO_FIELD_OBJECT_SCHEMA_SPEC: 'No field, object, or schema spec extracted, routing to retry',

  // Understanding phase errors
  FIELD_SPEC_EXTRACTION_FAILED: 'Failed to extract field specification from the message',
  OBJECT_SPEC_EXTRACTION_FAILED: 'Failed to extract object specification from the message',
  SCHEMA_SPEC_EXTRACTION_FAILED: 'Failed to extract schema specification from the message',
  FIELD_UNDERSTANDING_FAILED: 'Field understanding failed',
  OBJECT_UNDERSTANDING_FAILED: 'Object understanding failed',
  SCHEMA_UNDERSTANDING_FAILED: 'Schema understanding failed',

  // Validation errors
  FIELD_VALIDATION_FAILED: (errors: string) => `Field specification validation failed: ${errors}`,
  OBJECT_VALIDATION_FAILED: (errors: string) => `Object specification validation failed: ${errors}`,
  SCHEMA_VALIDATION_FAILED: (errors: string) => `Schema specification validation failed: ${errors}`,

  // Design phase errors
  SCHEMA_DESIGN_FAILED: 'Schema design failed',
  SCHEMA_DESIGN_VALIDATION_FAILED: (message: string) =>
    `Schema design validation failed: ${message}`,
  DB_DESIGN_VALIDATION_FAILED: (message: string) => `DB design validation failed: ${message}`,
  DATABASE_SCHEMA_DESIGN_VALIDATION_FAILED: (message: string) =>
    `Database schema design validation failed: ${message}`,
  NO_DB_DESIGN_RESULT: 'No DB design result, routing to retry',

  // Type mapping errors
  NO_TYPE_MAPPING_RESULT: 'No type mapping result, routing to retry',
  TYPE_MAPPING_ERRORS_DETECTED: 'Type mapping errors detected, routing to error',
  NO_MAPPED_FIELDS: 'No mapped fields, routing to retry',

  // Execution phase errors
  NO_EXECUTION_RESULT: 'No execution result, routing to retry',
  EXECUTION_FAILED_NO_COMPLETED_STEPS: 'Execution failed with no completed steps, routing to error',
  EXECUTION_FAILED_WITH_COMPLETED_STEPS:
    'Execution failed but has completed steps, routing to retry for remaining steps',
  PARTIAL_EXECUTION: 'Partial execution, routing to retry for remaining steps',
  SCHEMA_EXECUTION_FAILED: 'Schema execution failed, routing to error',
  SCHEMA_EXECUTION_PARTIAL: 'Schema execution partial, routing to retry',
  SCHEMA_EXECUTION_ERROR: (message: string) => `Schema execution failed: ${message}`,
  SCHEMA_SPEC_MISSING: 'Schema design result or specification is missing',
  SCHEMA_SPEC_OR_DESIGN_MISSING: 'Schema specification or design result is missing',

  // Retry errors
  MAXIMUM_RETRY_EXCEEDED: 'Maximum retry',
} as const;

// Success Message Templates
export const SUCCESS_TEMPLATES = {
  OBJECT_CREATED: 'Object created successfully',
  FIELD_ADDED: 'Field added successfully',
  SCHEMA_CREATED: 'Schema created successfully',
  PROCESSING_COMPLETED: 'Processing completed successfully',
  PROCESSING_FAILED: 'Object processing failed',
} as const;

// Validation Message Templates
export const VALIDATION_TEMPLATES = {
  OBJECT_NAME_REQUIRED: 'Object name is required',
  SCHEMA_NAME_REQUIRED: 'Schema name is required',
  FIELD_NAME_REQUIRED: 'All fields must have a name',
  FIELD_TYPE_HINT_REQUIRED: (fieldName: string) => `Field '${fieldName}' must have a type hint`,
  FIELD_TYPE_NAME_REQUIRED: (fieldName: string) => `Field '${fieldName}' must have a typeName`,
  DUPLICATE_FIELD_NAMES: (duplicates: string) => `Duplicate field names found: ${duplicates}`,
  DUPLICATE_OBJECT_NAMES: (duplicates: string) => `Duplicate object names found: ${duplicates}`,
  SCHEMA_MUST_CONTAIN_OBJECTS: 'Schema must contain at least one object',
  OBJECT_MUST_CONTAIN_FIELDS: (objectName: string) =>
    `Object '${objectName}' must contain at least one field`,
  INVALID_SUBTYPE: (subType: string, fieldName: string, typeName: string) =>
    `Invalid subType '${subType}' for ${typeName} field '${fieldName}'`,
  RELATION_FIELD_TARGET_REQUIRED: (fieldName: string) =>
    `Relation field '${fieldName}' must specify a target object`,
  CREATION_ORDER_REQUIRED: 'Creation order is required',
  ALL_OBJECTS_MUST_HAVE_NAME: 'All objects must have a name',
  ALL_FIELDS_MUST_HAVE_NAME: (objectName: string) =>
    `All fields in object '${objectName}' must have a name`,
  FIELD_MUST_HAVE_TYPE_HINT: (fieldName: string, objectName: string) =>
    `Field '${fieldName}' in object '${objectName}' must have a type hint`,
} as const;

export const OBJECT_LOG_MESSAGES = MESSAGE_TEMPLATES;
export const OBJECT_ERROR_MESSAGES = ERROR_TEMPLATES;
export const OBJECT_SUCCESS_MESSAGES = SUCCESS_TEMPLATES;
export const OBJECT_VALIDATION_MESSAGES = VALIDATION_TEMPLATES;
