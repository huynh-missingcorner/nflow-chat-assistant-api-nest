export const ApplicationErrors = {
  GENERATION_FAILED: 'Failed to generate application configuration',
  INVALID_INTENT: 'Invalid or incomplete intent data provided',
  MISSING_REQUIRED_FEATURES: 'Missing required features in the intent',
  INVALID_COMPONENT_TYPE: 'Invalid component type specified',
  OPENAI_ERROR: 'Error communicating with OpenAI service',
  CONTEXT_LOAD_ERROR: 'Failed to load agent context files',
} as const;
