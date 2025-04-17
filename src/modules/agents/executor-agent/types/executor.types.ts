import { FlowCreateDto, CreateLayoutDto } from 'src/modules/nflow/types';
import { FieldDto, ObjectDto, UpdateApplicationDto } from 'src/modules/nflow/types';
import { CreateApplicationDto } from 'src/modules/nflow/types';
import { HITLRequest } from '../../coordinator-agent/types';
import { AgentOutput } from '../../types';

export type FunctionArguments =
  | { name: 'ApiAppBuilderController_createApp'; args: CreateApplicationDto }
  | { name: 'ApiAppBuilderController_updateApp'; args: UpdateApplicationDto }
  | { name: 'ObjectController_changeObject'; args: ObjectDto }
  | { name: 'FieldController_changeField'; args: FieldDto }
  | { name: 'ApiLayoutBuilderController_createLayout'; args: CreateLayoutDto }
  | { name: 'ApiFlowController_createFlow'; args: FlowCreateDto };

export interface NflowRequest {
  order: number;
  data: {
    functionName: FunctionArguments['name'];
    arguments: FunctionArguments['args'];
  };
}

export interface ProcessedTasks {
  results: Record<string, AgentOutput>;
  pendingHITL?: Record<string, HITLRequest>;
}

export interface ExecutionResult {
  id: string;
  agent: string;
  response: unknown; // Reponse data from nFlow API
  success: boolean;
  error?: string;
}

export interface ExecutorOptions {
  stopOnError?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}
