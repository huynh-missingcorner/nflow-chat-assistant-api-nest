export const ObjectErrors = {
  GENERATION_FAILED: 'Failed to generate object definitions',
  INVALID_FEATURES: 'Invalid or incomplete features provided',
  INVALID_FIELD_TYPE: 'Invalid field type specified',
  INVALID_REFERENCE: 'Invalid object reference configuration',
  INVALID_VALIDATION: 'Invalid field validation configuration',
  OPENAI_ERROR: 'Error communicating with OpenAI service',
  CONTEXT_LOAD_ERROR: 'Failed to load agent contexts',
  TOOL_CALLS_GENERATION_FAILED: 'Failed to generate tool calls',
  SCHEMA_DESIGN_FAILED: 'Failed to design object schemas',
  UPDATE_FAILED: 'Failed to update object',
} as const;
