import { Injectable, Logger } from '@nestjs/common';
import { NFlowApplicationService } from '../../nflow/services/application.service';
import { NFlowObjectService } from '../../nflow/services/object.service';
import { NFlowLayoutService } from '../../nflow/services/layout.service';
import { NFlowFlowService } from '../../nflow/services/flow.service';
import { AxiosError } from 'axios';
import { ExecutionResult, ExecutorOptions, NflowRequest } from './types/executor.types';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  ObjectDto,
  FieldDto,
  CreateLayoutDto,
  FlowCreateDto,
} from '../../nflow/types';
import { AgentOutput } from '../types';

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
  async execute(tasks: Record<string, AgentOutput>): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    try {
      // Sort all tool calls by order
      const sortedCalls = this.getSortedToolCalls(tasks);

      // Execute each tool call in order
      for (const { agentName, call } of sortedCalls) {
        const result = await this.executeToolCall(call);
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

  /**
   * Get all tool calls sorted by order
   */
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
              order: call.order ?? 0, // Provide default order if not present
            },
          });
        }
      }
    }

    // Sort by order if available, otherwise keep original sequence
    return allCalls.sort((a, b) => (a.call.order ?? 0) - (b.call.order ?? 0));
  }

  /**
   * Execute a single tool call with retry logic
   */
  private async executeToolCall(call: NflowRequest, callTime: number = 1): Promise<unknown> {
    this.logger.log(`Executing tool call: ${call.functionName}`);
    try {
      return await this.executeFunction(call.functionName, call.arguments);
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
        return this.executeToolCall(call, callTime + 1);
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
  ): Promise<unknown> {
    switch (functionName) {
      case 'ApiAppBuilderController_createApp': {
        const typedArgs = args as unknown as CreateApplicationDto;
        return this.applicationService.createApp(typedArgs);
      }
      case 'ApiAppBuilderController_updateApp': {
        const typedArgs = args as unknown as UpdateApplicationDto;
        return this.applicationService.updateApp(typedArgs);
      }
      case 'ObjectController_changeObject': {
        const typedArgs = args as unknown as ObjectDto;
        return this.objectService.changeObject(typedArgs);
      }
      case 'FieldController_changeField': {
        const typedArgs = args as unknown as FieldDto;
        return this.objectService.changeField(typedArgs);
      }
      case 'ApiLayoutBuilderController_createLayout': {
        const typedArgs = args as unknown as CreateLayoutDto;
        return this.layoutService.createLayout(typedArgs);
      }
      case 'ApiFlowController_createFlow': {
        const typedArgs = args as unknown as FlowCreateDto;
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
