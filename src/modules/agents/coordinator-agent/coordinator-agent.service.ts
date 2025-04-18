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
      // Get chat context
      const chatContext = await this.chatContextService.getChatContext(sessionId);

      // Generate intent plan
      const intentPlan = await this.intentService.run({
        message,
        chatContext,
      });

      // Execute tasks based on intent plan
      const taskResults = await this.taskExecutorService.executeTasksInOrder(
        intentPlan.tasks,
        sessionId,
      );

      // Check if any tasks need human clarification
      if (taskResults.pendingHITL && Object.keys(taskResults.pendingHITL).length > 0) {
        // Get the first HITL request (we'll handle one at a time)
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

      // Execute the generated tool calls
      const executionResults = await this.executorService.execute(taskResults.results);

      // Generate a response summarizing what was done
      const response = await this.openAIService.generateChatCompletion([
        {
          role: 'system',
          content: prompts.SUMMARY,
        },
        ...chatContext,
        {
          role: 'user',
          content: `Here is what was done: ${JSON.stringify({ executionResults: taskResults, executionResult: executionResults })}. ${prompts.RETURN_APP_LINK}`,
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

  async processHITLResponse(
    userResponse: string,
    sessionId: string,
    hitlData: { taskId: string; remainingTasks: IntentTask[] },
  ): Promise<CoordinatorAgentOutput> {
    try {
      // Get chat context
      const chatContext = await this.chatContextService.getChatContext(sessionId);

      // Process the HITL response and continue execution
      const updatedResults = await this.taskExecutorService.processHITLResponse(
        hitlData.taskId,
        userResponse,
        sessionId,
        hitlData.remainingTasks,
      );

      // Check if there are more HITL requests
      if (updatedResults.pendingHITL && Object.keys(updatedResults.pendingHITL).length > 0) {
        // Handle the next HITL request
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

      // Extract tool calls from execution results
      const executionResult = await this.executorService.execute(updatedResults.results);

      // Generate a response summarizing what was done
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
}
