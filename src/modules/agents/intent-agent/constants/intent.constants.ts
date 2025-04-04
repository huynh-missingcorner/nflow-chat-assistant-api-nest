/**
 * Error messages for the Intent & Feature Extraction Agent
 */
export const IntentErrors = {
  PARSE_ERROR: 'Failed to parse intent extraction response',
  EXTRACTION_ERROR: 'Failed to extract intent from user message',
  INVALID_STRUCTURE: 'Invalid intent structure',
  MISSING_DATA: 'Missing required intent data',
} as const;
