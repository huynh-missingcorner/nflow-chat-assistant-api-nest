import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';

import { ActiveAgent, DEFAULT_AGENT_STATUS, AgentStatus } from './consts';
import { IntentService } from '../intent-agent/intent.service';
import { ApplicationService } from '../application-agent/application.service';
import { ObjectService } from '../object-agent/object.service';
import { LayoutService } from '../layout-agent/layout.service';
import { FlowService } from '../flow-agent/flow.service';
import { ExecutorService } from '../executor-agent/executor.service';
import { ChatMessageService } from 'src/modules/chat/services/chat-message.service';
import { ProcessedTasks } from '../executor-agent/types/executor.types';
import { IntentPlan, IntentTask } from '../intent-agent/types/intent.types';
import {
  GenerateApplicationParams,
  GenerateApplicationResponse,
} from '../application-agent/types/application.types';
import { GenerateObjectsParams, GenerateObjectsResponse } from '../object-agent/types/object.types';
import { GenerateLayoutsParams, GenerateLayoutsResponse } from '../layout-agent/types/layout.types';
import { GenerateFlowsParams, GenerateFlowsResponse } from '../flow-agent/types/flow.types';
import { MessageRole } from 'src/modules/chat/dto/chat-message.dto';
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
  private agentStatus: Record<ActiveAgent, AgentStatus> = { ...DEFAULT_AGENT_STATUS };

  constructor(
    private readonly intentService: IntentService,
    private readonly applicationService: ApplicationService,
    private readonly objectService: ObjectService,
    private readonly layoutService: LayoutService,
    private readonly flowService: FlowService,
    private readonly openAIService: OpenAIService,
    private readonly executorService: ExecutorService,
    private readonly chatMessageService: ChatMessageService,
  ) {}

  async processUserMessage(message: string, sessionId: string): Promise<{ reply: string }> {
    try {
      const chatContext = await this.getChatContext(sessionId);
      const intentPlan = await this.intentService.run({
        message,
        chatContext,
      });

      // Process tasks in order based on dependencies
      const processedTasks = await this.processTasksInOrder(intentPlan);

      const executionResult = await this.executorService.execute(processedTasks);

      // Generate a response summarizing what was done
      const response = await this.openAIService.generateChatCompletion([
        {
          role: 'system',
          content: prompts.SUMMARY,
        },
        ...chatContext,
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
    return `${name.toLowerCase()}${Date.now()}`.replace(/[^a-z0-9_]/g, '_');
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
        call.toolCall.functionName === 'ApiLayoutBuilderController_createLayout' &&
        call.toolCall.arguments.name
      ) {
        call.toolCall.arguments.name = this.generateUniqueNameWithTimestamp(
          call.toolCall.arguments.name,
        );
      } else if (
        call.toolCall.functionName === 'ApiFlowController_createFlow' &&
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

  private async processTasksInOrder(intentPlan: IntentPlan): Promise<ProcessedTasks> {
    const results: ProcessedTasks = {};
    const completed = new Set<string>();

    // Filter out tasks for disabled agents
    const tasks = intentPlan.tasks.filter((task) => {
      const isEnabled = this.agentStatus[task.agent as ActiveAgent]?.enabled ?? false;
      if (!isEnabled) {
        this.logger.log(`Skipping task for disabled agent: ${task.agent}`);
        // Mark as completed so dependent tasks don't get stuck
        completed.add(task.agent);
      }
      return isEnabled;
    });

    // Create a map to store original to unique name mappings
    const nameMap = new Map<string, string>();

    while (tasks.length > 0) {
      let executableTasks = tasks.filter(
        (task) => !task.dependsOn || task.dependsOn.every((dep) => completed.has(dep)),
      );

      // If there is only one task, we don't need to check for circular dependencies
      if (intentPlan.tasks.length === 1) {
        executableTasks = tasks;
      }

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

          const index = tasks.findIndex((t) => t.agent === task.agent);
          if (index !== -1) {
            tasks.splice(index, 1);
          }
        }),
      );
    }

    return results;
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

    const agentKey = task.agent as ActiveAgent;
    if (!this.agentStatus[agentKey]?.enabled) {
      this.logger.warn(`Attempted to execute task for disabled agent: ${task.agent}`);

      // Return an empty response for disabled agents
      return {
        toolCalls: [],
      };
    }

    switch (task.agent) {
      case 'ApplicationAgent':
        return this.applicationService.run(task.data as GenerateApplicationParams);
      case 'ObjectAgent':
        return this.objectService.run(task.data as GenerateObjectsParams);
      case 'LayoutAgent':
        return this.layoutService.run(task.data as GenerateLayoutsParams);
      case 'FlowAgent':
        return this.flowService.run(task.data as GenerateFlowsParams);
      default:
        throw new Error('Unknown agent type');
    }
  }

  private async getChatContext(
    sessionId: string,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const savedMessages = await this.chatMessageService.findAllBySessionId(sessionId);
    const chatContext = savedMessages.map((message) => ({
      role: message.role === MessageRole.USER ? ('user' as const) : ('assistant' as const),
      content: message.content,
    }));

    return chatContext;
  }
}
