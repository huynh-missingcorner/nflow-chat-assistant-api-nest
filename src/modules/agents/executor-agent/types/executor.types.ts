import { FlowCreateDto, CreateLayoutDto } from 'src/modules/nflow/types';
import { FieldDto, ObjectDto, UpdateApplicationDto } from 'src/modules/nflow/types';
import { CreateApplicationDto } from 'src/modules/nflow/types';
import { GenerateApplicationResponse } from '../../application-agent/types/application.types';
import { GenerateFlowsResponse } from '../../flow-agent/types/flow.types';
import { GenerateLayoutsResponse } from '../../layout-agent/types/layout.types';
import { GenerateObjectsResponse } from '../../object-agent/types/object.types';

export type FunctionArguments =
  | { name: 'ApiAppBuilderController_createApp'; args: CreateApplicationDto }
  | { name: 'ApiAppBuilderController_updateApp'; args: UpdateApplicationDto }
  | { name: 'ObjectController_changeObject'; args: ObjectDto }
  | { name: 'FieldController_changeField'; args: FieldDto }
  | { name: 'ApiLayoutBuilderController_createLayout'; args: CreateLayoutDto }
  | { name: 'ApiFlowController_createFlow'; args: FlowCreateDto };

export interface ToolCall {
  order: number;
  toolCall: {
    functionName: FunctionArguments['name'];
    arguments: FunctionArguments['args'];
  };
}

// export interface AgentResult {
//   toolCalls: ToolCall[];
//   metadata: Record<string, unknown>;
// }

export type AgentResult =
  | GenerateApplicationResponse
  | GenerateObjectsResponse
  | GenerateLayoutsResponse
  | GenerateFlowsResponse;

export interface ProcessedTasks {
  [key: string]: AgentResult;
}

export interface ExecutionResult {
  success: boolean;
  results: {
    [key: string]: {
      success: boolean;
      data?: unknown;
      error?: string;
    }[];
  };
  error?: string;
}

export interface ExecutorOptions {
  stopOnError?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}
