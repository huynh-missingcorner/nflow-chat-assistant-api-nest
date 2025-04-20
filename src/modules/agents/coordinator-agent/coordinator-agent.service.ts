import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { IntentAgentService } from '../intent-agent/intent-agent.service';
import { ExecutorAgentService } from '../executor-agent/executor-agent.service';
import prompts from './consts/prompts';
import { CoordinatorAgentInput, CoordinatorAgentOutput } from './types';
import { BaseAgentService } from '../base-agent.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { TaskExecutorService } from './services/task-executor.service';
import { ChatContextService } from './services/chat-context.service';
import { IntentTask } from '../intent-agent/types/intent.types';
import { ClassifierAgentService } from '../classifier-agent/classifier-agent.service';
import { MessageType } from '../classifier-agent/types/classifier.types';
import { MemoryService } from 'src/modules/memory/memory.service';

@Injectable()
export class CoordinatorAgentService extends BaseAgentService<
  CoordinatorAgentInput,
  CoordinatorAgentOutput
> {
  constructor(
    private readonly intentService: IntentAgentService,
    private readonly executorService: ExecutorAgentService,
    private readonly taskExecutorService: TaskExecutorService,
    private readonly chatContextService: ChatContextService,
    private readonly classifierService: ClassifierAgentService,
    private readonly memoryService: MemoryService,
    contextLoader: ContextLoaderService,
    openAIService: OpenAIService,
  ) {
    super(openAIService, contextLoader, AGENT_PATHS.COORDINATOR);
  }

  async run(input: CoordinatorAgentInput): Promise<CoordinatorAgentOutput> {
    return this.processUserMessage(input.message, input.sessionId);
  }

  private async processUserMessage(
    message: string,
    sessionId: string,
  ): Promise<CoordinatorAgentOutput> {
    try {
      // Classify the user message
      const classification = await this.classifierService.classifyMessage(message);
      this.logger.log(`Message classified as: ${classification.type}`);

      // Route the message based on its classification
      return this.routeMessage(classification.type, message, sessionId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.logger.error('Error in processUserMessage', error);
      return {
        reply: `I apologize, but I encountered an error while processing your message: ${errorMessage}`,
      };
    }
  }

  private async routeMessage(
    messageType: MessageType,
    message: string,
    sessionId: string,
  ): Promise<CoordinatorAgentOutput> {
    const chatContext = await this.chatContextService.getChatContext(sessionId);
    const shortTermMemory = await this.memoryService.getContext(sessionId);

    await this.memoryService.patch(shortTermMemory, {
      chatHistory: chatContext,
    });

    switch (messageType) {
      case 'nflow_action':
        return this.processNflowAgentsFlow(message, sessionId);

      case 'context_query':
        return this.processContextQuery(message, sessionId);

      case 'casual_chat':
        return this.processCasualChat(message, sessionId);

      default:
        return this.processNflowAgentsFlow(message, sessionId);
    }
  }

  private async processContextQuery(
    message: string,
    sessionId: string,
  ): Promise<CoordinatorAgentOutput> {
    try {
      const shortTermMemory = await this.memoryService.getContext(sessionId);
      const response = await this.openAIService.generateChatCompletion([
        {
          role: 'system',
          content: `${prompts.CONTEXT_QUERY}\n\nHere is the short term memory: ${JSON.stringify(shortTermMemory)}`,
        },
        ...shortTermMemory.chatHistory,
        {
          role: 'user',
          content: message,
        },
      ]);

      if (!response.content) {
        throw new Error('Failed to generate response for context query');
      }

      return {
        reply: response.content,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.logger.error('Error in processContextQuery', error);
      return {
        reply: `I apologize, but I encountered an error while retrieving context information: ${errorMessage}`,
      };
    }
  }

  private async processCasualChat(
    message: string,
    sessionId: string,
  ): Promise<CoordinatorAgentOutput> {
    const shortTermMemory = await this.memoryService.getContext(sessionId);
    const response = await this.openAIService.generateChatCompletion([
      {
        role: 'system',
        content: `${prompts.CASUAL_CHAT}\n\nHere is the short term memory: ${JSON.stringify(shortTermMemory)}`,
      },
      ...shortTermMemory.chatHistory,
      {
        role: 'user',
        content: message,
      },
    ]);

    if (!response.content) {
      throw new Error('Failed to generate response for casual chat');
    }

    return {
      reply: response.content,
    };
  }

  async processHITLResponse(
    userResponse: string,
    sessionId: string,
    hitlData: { taskId: string; remainingTasks: IntentTask[] },
  ): Promise<CoordinatorAgentOutput> {
    try {
      const chatContext = await this.chatContextService.getChatContext(sessionId);
      const updatedResults = await this.taskExecutorService.processHITLResponse(
        hitlData.taskId,
        userResponse,
        sessionId,
        hitlData.remainingTasks,
      );

      if (updatedResults.pendingHITL && Object.keys(updatedResults.pendingHITL).length > 0) {
        const [taskId, hitlRequest] = Object.entries(updatedResults.pendingHITL)[0];

        return {
          reply: hitlRequest.prompt,
          requiresHITL: true,
          hitlData: {
            taskId,
            remainingTasks: hitlData.remainingTasks.filter((task) => task.id !== hitlData.taskId),
          },
        };
      }

      const executionResult = await this.executorService.execute(updatedResults.results, sessionId);

      const aiResponse = await this.openAIService.generateChatCompletion([
        {
          role: 'system',
          content: prompts.SUMMARY,
        },
        ...chatContext,
        {
          role: 'user',
          content: `Here is what was done: ${JSON.stringify({ updatedResults, executionResult })}. ${prompts.RETURN_APP_LINK}`,
        },
      ]);

      if (!aiResponse.content) {
        throw new Error('Failed to generate response');
      }

      return {
        reply: aiResponse.content,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.logger.error('Error in processHITLResponse', error);
      return {
        reply: `I apologize, but I encountered an error while processing your response: ${errorMessage}`,
      };
    }
  }

  private async processNflowAgentsFlow(
    message: string,
    sessionId: string,
  ): Promise<CoordinatorAgentOutput> {
    const shortTermMemory = await this.memoryService.getContext(sessionId);
    const intentPlan = await this.intentService.run({
      message,
      sessionId,
    });

    const taskResults = await this.taskExecutorService.executeTasksInOrder(
      intentPlan.tasks,
      sessionId,
    );

    if (taskResults.pendingHITL && Object.keys(taskResults.pendingHITL).length > 0) {
      const [taskId, hitlRequest] = Object.entries(taskResults.pendingHITL)[0];

      return {
        reply: hitlRequest.prompt,
        requiresHITL: true,
        hitlData: {
          taskId,
          remainingTasks: intentPlan.tasks,
        },
      };
    }

    const executionResults = await this.executorService.execute(taskResults.results, sessionId);
    const response = await this.openAIService.generateChatCompletion([
      {
        role: 'system',
        content: prompts.SUMMARY,
      },
      ...shortTermMemory.chatHistory,
      {
        role: 'user',
        content: `Here is what was done: ${JSON.stringify({
          executionResults,
          createdApplications: shortTermMemory.createdApplications,
          createdObjects: shortTermMemory.createdObjects,
          createdLayouts: shortTermMemory.createdLayouts,
          createdFlows: shortTermMemory.createdFlows,
        })}. ${prompts.RETURN_APP_LINK}`,
      },
    ]);

    if (!response.content) {
      throw new Error('Failed to generate response');
    }

    return {
      reply: response.content ?? '',
    };
  }
}
