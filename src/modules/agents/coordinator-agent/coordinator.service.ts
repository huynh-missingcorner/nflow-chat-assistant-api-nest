import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { IntentService } from '../intent-agent/intent.service';
import { ExecutorService } from '../executor-agent/executor.service';
import prompts from './consts/prompts';
import { CoordinatorAgentInput, CoordinatorAgentOutput } from './types';
import { BaseAgentService } from '../base-agent.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { TaskExecutorService } from './services/task-executor.service';
import { ChatContextService } from './services/chat-context.service';

@Injectable()
export class CoordinatorService extends BaseAgentService<
  CoordinatorAgentInput,
  CoordinatorAgentOutput
> {
  constructor(
    private readonly intentService: IntentService,
    private readonly executorService: ExecutorService,
    private readonly taskExecutorService: TaskExecutorService,
    private readonly chatContextService: ChatContextService,
    contextLoader: ContextLoaderService,
    openAIService: OpenAIService,
  ) {
    super(openAIService, contextLoader, AGENT_PATHS.COORDINATOR);
  }

  /**
   * Execute the coordinator agent
   * @param input The input for the coordinator agent
   * @returns The output from the coordinator agent
   */
  async run(input: CoordinatorAgentInput): Promise<CoordinatorAgentOutput> {
    return this.processUserMessage(input.message, input.sessionId);
  }

  /**
   * Process a user message and coordinate agent execution
   * @param message The user message
   * @param sessionId The session ID
   * @returns The coordinator agent output
   */
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
      const toolCalls = await this.taskExecutorService.executeTasksInOrder(intentPlan.tasks);

      // Execute the generated tool calls
      const executionResult = await this.executorService.execute(toolCalls);

      // Generate a response summarizing what was done
      const response = await this.openAIService.generateChatCompletion([
        {
          role: 'system',
          content: prompts.SUMMARY,
        },
        ...chatContext,
        {
          role: 'user',
          content: `Here is what was done: ${JSON.stringify({ toolCalls, executionResult })}. ${prompts.RETURN_APP_LINK}`,
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
}
