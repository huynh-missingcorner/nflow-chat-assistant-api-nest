export const ExecutionErrors = {
  API_CALL_FAILED: 'Failed to execute API call',
  MAX_RETRIES_EXCEEDED: 'Maximum retry attempts exceeded',
  INVALID_RESPONSE: 'Invalid response from Nflow API',
  MISSING_REQUIRED_DATA: 'Missing required data for API call',
} as const;

export const ExecutionConfig = {
  DEFAULT_MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 30000,
} as const;
