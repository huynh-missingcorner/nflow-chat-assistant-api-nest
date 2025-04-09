/**
 * Error messages for the Intent & Feature Extraction Agent
 */
export const IntentErrors = {
  PARSE_ERROR: 'Failed to parse intent response',
  EXTRACTION_ERROR: 'Failed to extract intent from message',
  INVALID_STRUCTURE: 'Invalid intent structure',
  MISSING_DATA: 'Missing required intent data',
  CONTEXT_LOAD_ERROR: 'Failed to load agent context files',
} as const;
