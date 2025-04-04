import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { IntentService } from '../agents/intent-agent/intent.service';

@Injectable()
export class CoordinatorService {
  private readonly logger = new Logger(CoordinatorService.name);

  constructor(
    private readonly intentService: IntentService,
    private readonly openAIService: OpenAIService,
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
      const intent = await this.intentService.extractIntent({
        message,
        chatContext,
      });

      const reply = await this.openAIService.generateChatCompletion([
        {
          role: 'system',
          content:
            'You are a helpful AI assistant that helps users build applications using Nflow.',
        },
        {
          role: 'user',
          content: `Here is the intent: ${JSON.stringify(intent)}`,
        },
      ]);

      return {
        reply,
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
