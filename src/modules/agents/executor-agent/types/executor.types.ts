import { FlowCreateDto, CreateLayoutDto } from 'src/modules/nflow/types';
import { FieldDto, ObjectDto, UpdateApplicationDto } from 'src/modules/nflow/types';
import { CreateApplicationDto } from 'src/modules/nflow/types';
import { ApplicationAgentOutput } from '../../application-agent/types/application.types';
import { FlowAgentOutput } from '../../flow-agent/types/flow.types';
import { LayoutAgentOutput } from '../../layout-agent/types/layout.types';
import { ObjectAgentOutput } from '../../object-agent/types/object.types';

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
  | ApplicationAgentOutput
  | ObjectAgentOutput
  | LayoutAgentOutput
  | FlowAgentOutput;

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
