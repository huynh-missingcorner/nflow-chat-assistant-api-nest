import { Injectable, Logger } from '@nestjs/common';
import { NFlowApplicationService } from '../../nflow/services/application.service';
import { NFlowObjectService } from '../../nflow/services/object.service';
import { NFlowLayoutService } from '../../nflow/services/layout.service';
import { NFlowFlowService } from '../../nflow/services/flow.service';
import { AxiosError } from 'axios';
import {
  ProcessedTasks,
  ExecutionResult,
  ExecutorOptions,
  ToolCall,
  FunctionArguments,
} from './types/executor.types';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  ObjectDto,
  FieldDto,
  CreateLayoutDto,
  FlowCreateDto,
} from '../../nflow/types';

@Injectable()
export class ExecutorAgentService {
  private readonly logger = new Logger(ExecutorAgentService.name);
  private readonly defaultOptions: Required<ExecutorOptions> = {
    stopOnError: true,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  constructor(
    private readonly applicationService: NFlowApplicationService,
    private readonly objectService: NFlowObjectService,
    private readonly layoutService: NFlowLayoutService,
    private readonly flowService: NFlowFlowService,
  ) {}

  /**
   * Execute all processed tasks in order
   */
  async execute(tasks: ProcessedTasks, options?: ExecutorOptions): Promise<ExecutionResult> {
    const finalOptions = { ...this.defaultOptions, ...options };
    const results: ExecutionResult['results'] = {};
    let hasError = false;

    try {
      // Sort all tool calls by order
      const sortedCalls = this.getSortedToolCalls(tasks);

      // Execute each tool call in order
      for (const { agentName, call } of sortedCalls) {
        if (!results[agentName]) {
          results[agentName] = [];
        }

        try {
          const result = await this.executeToolCall(call);
          results[agentName].push({
            success: true,
            data: result,
          });
        } catch (error) {
          hasError = true;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          results[agentName].push({
            success: false,
            error: errorMessage,
          });

          if (finalOptions.stopOnError) {
            throw new Error(`Execution failed at ${agentName}: ${errorMessage}`);
          }
        }
      }

      return {
        success: !hasError,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        results,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all tool calls sorted by order
   */
  private getSortedToolCalls(tasks: ProcessedTasks): Array<{ agentName: string; call: ToolCall }> {
    const allCalls: Array<{ agentName: string; call: ToolCall }> = [];

    for (const [agentName, result] of Object.entries(tasks)) {
      if ('toolCalls' in result) {
        for (const call of result.toolCalls) {
          allCalls.push({ agentName, call: call as unknown as ToolCall });
        }
      }
    }

    return allCalls.sort((a, b) => a.call.order - b.call.order);
  }

  /**
   * Execute a single tool call with retry logic
   */
  private async executeToolCall(call: ToolCall, callTime: number = 1): Promise<unknown> {
    this.logger.log(`Executing tool call: ${call.toolCall.functionName}`);
    try {
      return await this.executeFunction(call.toolCall.functionName, call.toolCall.arguments);
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Error executing tool call: ${call.toolCall.functionName} - ${error.response?.data}`,
        );
      } else {
        this.logger.error(`Error executing tool call: ${call.toolCall.functionName} - ${error}`);
      }

      if (this.defaultOptions.retryAttempts > 0 && callTime < this.defaultOptions.retryAttempts) {
        await this.delay(this.defaultOptions.retryDelay);
        return this.executeToolCall(call, callTime + 1);
      }

      // Log final failure and return null instead of throwing
      this.logger.error(
        `Tool call ${call.toolCall.functionName} failed after ${this.defaultOptions.retryAttempts} retries`,
      );
      return null;
    }
  }

  /**
   * Execute the appropriate function based on the function name
   */
  private async executeFunction(
    functionName: FunctionArguments['name'],
    args: FunctionArguments['args'],
  ): Promise<unknown> {
    switch (functionName) {
      case 'ApiAppBuilderController_createApp': {
        const typedArgs = args as CreateApplicationDto;
        return this.applicationService.createApp(typedArgs);
      }
      case 'ApiAppBuilderController_updateApp': {
        const typedArgs = args as UpdateApplicationDto;
        return this.applicationService.updateApp(typedArgs);
      }
      case 'ObjectController_changeObject': {
        const typedArgs = args as ObjectDto;
        return this.objectService.changeObject(typedArgs);
      }
      case 'FieldController_changeField': {
        const typedArgs = args as FieldDto;
        return this.objectService.changeField(typedArgs);
      }
      case 'ApiLayoutBuilderController_createLayout': {
        const typedArgs = args as CreateLayoutDto;
        return this.layoutService.createLayout(typedArgs);
      }
      case 'ApiFlowController_createFlow': {
        const typedArgs = args as FlowCreateDto;
        return this.flowService.createFlow(typedArgs);
      }
      default: {
        throw new Error(`Unsupported function: ${String(functionName)}`);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
