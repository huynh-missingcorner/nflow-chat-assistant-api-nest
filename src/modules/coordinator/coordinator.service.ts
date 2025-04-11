import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { IntentService } from '../agents/intent-agent/intent.service';
import { ApplicationService } from '../agents/application-agent/application.service';
import { ObjectService } from '../agents/object-agent/object.service';
import { LayoutService } from '../agents/layout-agent/layout.service';
import { FlowService } from '../agents/flow-agent/flow.service';
import { IntentPlan, IntentTask } from '../agents/intent-agent/types/intent.types';
import {
  GenerateApplicationParams,
  GenerateApplicationResponse,
} from '../agents/application-agent/types/application.types';
import {
  GenerateObjectsParams,
  GenerateObjectsResponse,
} from '../agents/object-agent/types/object.types';
import { GenerateLayoutsResponse } from '../agents/layout-agent/types/layout.types';
import { GenerateFlowsResponse } from '../agents/flow-agent/types/flow.types';
import { ExecutorService } from '../agents/executor-agent/executor.service';
import { ProcessedTasks } from '../agents/executor-agent/types/executor.types';
import prompts from './consts/prompts';

interface BaseAgentResponse {
  toolCalls: ToolCall[];
  metadata: Record<string, unknown>;
}

interface ToolCallArguments {
  name?: string;
  objName?: string;
  data?: {
    name: string;
    relationships?: Array<{
      targetObject: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ToolCall {
  order: number;
  toolCall: {
    functionName: string;
    arguments: ToolCallArguments;
  };
}

@Injectable()
export class CoordinatorService {
  private readonly logger = new Logger(CoordinatorService.name);

  constructor(
    private readonly intentService: IntentService,
    private readonly applicationService: ApplicationService,
    private readonly objectService: ObjectService,
    private readonly layoutService: LayoutService,
    private readonly flowService: FlowService,
    private readonly openAIService: OpenAIService,
    private readonly executorService: ExecutorService,
  ) {}

  /**
   * Process a user message through the multi-agent system
   * @param message User's message
   * @param chatContext Previous chat history for context
   * @returns Object containing the reply and app URL if applicable
   */
  async processUserMessage(
    message: string,
    chatContext: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<{ reply: string; appUrl?: string }> {
    try {
      // Extract the intent from the user's message
      const intentPlan = await this.intentService.extractIntent({
        message,
        chatContext,
      });

      // Process tasks in order based on dependencies
      const processedTasks = await this.processTasksInOrder(intentPlan);

      const executionResult = await this.executorService.execute(processedTasks.results);

      // Generate a response summarizing what was done
      const response = await this.openAIService.generateChatCompletion([
        {
          role: 'system',
          content: prompts.SUMMARY,
        },
        {
          role: 'user',
          content: `Here is what was done: ${JSON.stringify({ processedTasks, executionResult })}. ${prompts.RETURN_APP_LINK}`,
        },
      ]);

      if (!response.content) {
        throw new Error('Failed to generate response');
      }

      return {
        reply: response.content,
        appUrl: processedTasks.appUrl,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.logger.error('Error in processUserMessage', error);
      return {
        reply: `I apologize, but I encountered an error while processing your message: ${errorMessage}`,
      };
    }
  }

  private generateUniqueNameWithTimestamp(name: string): string {
    return `${name.toLowerCase()}${Date.now()}`;
  }

  private addUniqueNamesToToolCalls(toolCalls: ToolCall[], nameMap: Map<string, string>): void {
    for (const call of toolCalls) {
      if (
        call.toolCall.functionName === 'ApiAppBuilderController_createApp' &&
        call.toolCall.arguments.name
      ) {
        call.toolCall.arguments.name = this.generateUniqueNameWithTimestamp(
          call.toolCall.arguments.name,
        );
      } else if (
        call.toolCall.functionName === 'ObjectController_changeObject' &&
        call.toolCall.arguments.data
      ) {
        const originalName = call.toolCall.arguments.data.name;
        const uniqueName = this.generateUniqueNameWithTimestamp(originalName);
        call.toolCall.arguments.data.name = uniqueName;
        nameMap.set(originalName, uniqueName);

        if (call.toolCall.arguments.data.relationships) {
          for (const rel of call.toolCall.arguments.data.relationships) {
            rel.targetObject =
              nameMap.get(rel.targetObject) ||
              this.generateUniqueNameWithTimestamp(rel.targetObject);
          }
        }
      } else if (call.toolCall.functionName === 'FieldController_changeField') {
        const objName = call.toolCall.arguments.objName;
        if (objName && nameMap.has(objName)) {
          call.toolCall.arguments.objName = nameMap.get(objName)!;
        }
      }
    }
  }

  private isAgentResponse(result: unknown): result is BaseAgentResponse {
    return result !== null && typeof result === 'object' && 'toolCalls' in result;
  }

  /**
   * Process tasks in order based on their dependencies
   * @param intentPlan The plan containing tasks to process
   * @returns Results of processing all tasks
   */
  private async processTasksInOrder(intentPlan: IntentPlan): Promise<{
    appUrl?: string;
    results: ProcessedTasks;
  }> {
    const results: ProcessedTasks = {};
    const completed = new Set<string>();
    const tasks = [...intentPlan.tasks];
    let appUrl: string | undefined;

    // Create a map to store original to unique name mappings
    const nameMap = new Map<string, string>();

    while (tasks.length > 0) {
      const executableTasks = tasks.filter(
        (task) => !task.dependsOn || task.dependsOn.every((dep) => completed.has(dep)),
      );

      if (executableTasks.length === 0 && tasks.length > 0) {
        throw new Error('Circular dependency detected in tasks');
      }

      await Promise.all(
        executableTasks.map(async (task) => {
          const result = await this.executeTask(task);

          if (this.isAgentResponse(result)) {
            this.addUniqueNamesToToolCalls(result.toolCalls, nameMap);
          }

          results[task.agent] = result;
          completed.add(task.agent);

          if (
            task.agent === 'ApplicationAgent' &&
            'applicationPayload' in result &&
            'appUrl' in result
          ) {
            appUrl = result.appUrl as string;
          }

          const index = tasks.findIndex((t) => t.agent === task.agent);
          if (index !== -1) {
            tasks.splice(index, 1);
          }
        }),
      );
    }

    return { appUrl, results };
  }

  /**
   * Execute a single task using the appropriate agent
   * @param task The task to execute
   * @returns Result of the task execution
   */
  private async executeTask(
    task: IntentTask,
  ): Promise<
    | GenerateApplicationResponse
    | GenerateObjectsResponse
    | GenerateLayoutsResponse
    | GenerateFlowsResponse
  > {
    this.logger.log(`Executing task for ${task.agent}: ${task.description}`);

    switch (task.agent) {
      case 'ApplicationAgent':
        return this.applicationService.generateApplication(task.data as GenerateApplicationParams);
      case 'ObjectAgent':
        return this.objectService.generateObjects(task.data as GenerateObjectsParams);
      case 'LayoutAgent':
        // return this.layoutService.generateLayouts(task.data as GenerateLayoutsParams);
        return {
          toolCalls: [],
          metadata: {},
        };
      case 'FlowAgent':
        // return this.flowService.generateFlows(task.data as GenerateFlowsParams);
        return {
          toolCalls: [],
          metadata: {},
        };
      default:
        throw new Error('Unknown agent type');
    }
  }
}
