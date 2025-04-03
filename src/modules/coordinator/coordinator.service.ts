import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';

@Injectable()
export class CoordinatorService {
  constructor(private readonly openAIService: OpenAIService) {}

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
      const messages = [
        {
          role: 'system' as const,
          content:
            'You are a helpful AI assistant that helps users build applications using Nflow. Be concise and clear in your responses.',
        },
        ...chatContext,
        { role: 'user' as const, content: message },
      ];

      // Generate response using OpenAI
      const reply = await this.openAIService.generateChatCompletion(messages);

      return {
        reply,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        reply: `I apologize, but I encountered an error while processing your message: ${errorMessage}`,
      };
    }
  }
}
