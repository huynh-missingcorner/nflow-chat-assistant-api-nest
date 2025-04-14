export const FlowErrors = {
  GENERATION_FAILED: 'Failed to generate flow definitions',
  INVALID_FEATURES: 'Invalid or incomplete features provided',
  INVALID_COMPONENTS: 'Invalid components configuration',
  INVALID_OBJECTS: 'Invalid objects configuration',
  INVALID_LAYOUTS: 'Invalid layouts configuration',
  INVALID_TRIGGER_TYPE: 'Invalid trigger type specified',
  INVALID_ACTION_TYPE: 'Invalid action type specified',
  INVALID_CONDITION: 'Invalid condition configuration',
  INVALID_SCHEDULE: 'Invalid schedule configuration',
  INVALID_WEBHOOK: 'Invalid webhook configuration',
  OPENAI_ERROR: 'Error communicating with OpenAI service',
  CONTEXT_LOAD_ERROR: 'Load agent contexts failed',
} as const;
