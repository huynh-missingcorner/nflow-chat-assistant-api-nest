import { AgentOutput, HITLRequest } from '@/modules/agents/types';

export interface ExecutionResult {
  id: string;
  agent: string;
  response: unknown;
  success: boolean;
}

export interface ExecutorOptions {
  stopOnError?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface NflowRequest {
  id: string;
  functionName: string;
  arguments: Record<string, unknown>;
  order?: number;
}

export type FunctionArguments = {
  name: string;
  args: Record<string, unknown>;
};

export interface ProcessedTasks {
  results: Record<string, AgentOutput>;
  pendingHITL?: Record<string, HITLRequest>;
}
