import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';

import {
  CreateApplicationDto,
  CreateLayoutDto,
  FieldDto,
  FlowCreateDto,
  ObjectDto,
  UpdateApplicationDto,
} from '../../nflow/types';
import { AgentOutput } from '../types';
import { AppExecutorService } from './services/app-executor.service';
import { FlowExecutorService } from './services/flow-executor.service';
import { LayoutExecutorService } from './services/layout-executor.service';
import { ObjectExecutorService } from './services/object-executor.service';
import { ExecutionResult, ExecutorOptions, NflowRequest } from './types/executor.types';

@Injectable()
export class ExecutorAgentService {
  private readonly logger = new Logger(ExecutorAgentService.name);
  private readonly defaultOptions: Required<ExecutorOptions> = {
    stopOnError: true,
    retryAttempts: 1,
    retryDelay: 1000,
  };

  constructor(
    private readonly layoutExecutorService: LayoutExecutorService,
    private readonly flowExecutorService: FlowExecutorService,
    private readonly appExecutorService: AppExecutorService,
    private readonly objectExecutorService: ObjectExecutorService,
  ) {}

  async execute(
    tasks: Record<string, AgentOutput>,
    chatSessionId: string,
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    try {
      const sortedCalls = this.getSortedToolCalls(tasks);

      // Execute each tool call in order
      for (const { agentName, call } of sortedCalls) {
        const result = await this.executeToolCall(call, chatSessionId);
        results.push({
          id: call.id,
          agent: agentName,
          response: result,
          success: true,
        });
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  private getSortedToolCalls(
    tasks: Record<string, AgentOutput>,
  ): Array<{ agentName: string; call: NflowRequest }> {
    const allCalls: Array<{ agentName: string; call: NflowRequest }> = [];

    for (const [agentName, agentOutput] of Object.entries(tasks)) {
      if ('toolCalls' in agentOutput) {
        for (const call of agentOutput.toolCalls) {
          allCalls.push({
            agentName,
            call: {
              ...call,
              order: call.order ?? 0,
            },
          });
        }
      }
    }

    return allCalls.sort((a, b) => (a.call.order ?? 0) - (b.call.order ?? 0));
  }

  /**
   * Execute a single tool call with retry logic
   */
  private async executeToolCall(
    call: NflowRequest,
    chatSessionId: string,
    callTime: number = 1,
  ): Promise<unknown> {
    this.logger.log(`Executing tool call: ${call.functionName}`);
    try {
      return await this.executeFunction(call.functionName, call.arguments, chatSessionId);
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Error executing tool call: ${call.functionName} - ${error.response?.data}`,
        );
      } else {
        this.logger.error(`Error executing tool call: ${call.functionName} - ${error}`);
      }

      if (this.defaultOptions.retryAttempts > 0 && callTime < this.defaultOptions.retryAttempts) {
        await this.delay(this.defaultOptions.retryDelay);
        return this.executeToolCall(call, chatSessionId, callTime + 1);
      }

      // Log final failure and return null instead of throwing
      this.logger.error(
        `Tool call ${call.functionName} failed after ${this.defaultOptions.retryAttempts} retries`,
      );
      return null;
    }
  }

  /**
   * Execute the appropriate function based on the function name
   */
  private async executeFunction(
    functionName: string,
    args: Record<string, unknown>,
    chatSessionId: string,
  ): Promise<unknown> {
    switch (functionName) {
      case 'ApiAppBuilderController_createApp': {
        const typedArgs = args as unknown as CreateApplicationDto;
        return this.appExecutorService.createApp(typedArgs, chatSessionId);
      }
      case 'ApiAppBuilderController_updateApp': {
        const typedArgs = args as unknown as UpdateApplicationDto;
        return this.appExecutorService.updateApp(typedArgs, chatSessionId);
      }
      case 'ObjectController_changeObject': {
        const typedArgs = args as unknown as ObjectDto;
        return this.objectExecutorService.changeObject(typedArgs, chatSessionId);
      }
      case 'FieldController_changeField': {
        const typedArgs = args as unknown as FieldDto;
        return this.objectExecutorService.changeField(typedArgs, chatSessionId);
      }
      case 'ApiLayoutBuilderController_createLayout': {
        const typedArgs = args as unknown as CreateLayoutDto;
        return this.layoutExecutorService.createLayout(typedArgs, chatSessionId);
      }
      case 'ApiFlowController_createFlow': {
        const typedArgs = args as unknown as FlowCreateDto;
        return this.flowExecutorService.createFlow(typedArgs, chatSessionId);
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
