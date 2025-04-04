export interface ExecutionResult {
  resource: 'app' | 'object' | 'layout' | 'flow';
  id: string;
  url?: string;
  error?: string;
  retryCount?: number;
}

export interface ExecuteApiCallParams {
  apiCall: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    payload?: unknown;
  };
  sessionId: string;
  messageId: string;
  maxRetries?: number;
}

export interface ExecutionResponse {
  results: ExecutionResult[];
  error?: string;
}
