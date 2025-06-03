import {
  ApplicationExecutionResult,
  ApplicationSpec,
  EnrichedApplicationSpec,
} from './application-graph-state.types';

export interface ApplicationAgentInput {
  message: string;
  chatSessionId: string;
}

export interface ApplicationAgentOutput {
  success: boolean;
  message: string;
  data: ApplicationAgentSuccessData | ApplicationAgentErrorData;
}

export interface ApplicationAgentSuccessData {
  executionResult: ApplicationExecutionResult;
  originalMessage: string;
  chatSessionId: string;
  applicationSpec: ApplicationSpec | null;
  enrichedSpec: EnrichedApplicationSpec | null;
}

export interface ApplicationAgentErrorData {
  error: string;
  currentNode?: string;
  retryCount?: number;
}
