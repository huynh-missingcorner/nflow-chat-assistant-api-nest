import {
  CreateAppRequest,
  CreateFlowRequest,
  UpdateAppRequest,
} from '../../../nflow/types/api.types';
import { ChangeObjectRequest, ChangeFieldRequest } from '../../../nflow/types/api.types';
import { CreateLayoutRequest } from '../../../nflow/types/api.types';
import { GenerateApplicationResponse } from '../../application-agent/types/application.types';
import { GenerateFlowsResponse } from '../../flow-agent/types/flow.types';
import { GenerateLayoutsResponse } from '../../layout-agent/types/layout.types';
import { GenerateObjectsResponse } from '../../object-agent/types/object.types';

export type FunctionArguments =
  | { name: 'ApiAppBuilderController_createApp'; args: CreateAppRequest }
  | { name: 'ApiAppBuilderController_updateApp'; args: UpdateAppRequest }
  | { name: 'ObjectController_changeObject'; args: ChangeObjectRequest }
  | { name: 'FieldController_changeField'; args: ChangeFieldRequest }
  | { name: 'ApiLayoutBuilderController_createLayout'; args: CreateLayoutRequest }
  | { name: 'ApiFlowController_createFlow'; args: CreateFlowRequest };

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
