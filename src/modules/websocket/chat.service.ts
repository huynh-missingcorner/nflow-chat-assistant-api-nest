import { Injectable, Logger } from '@nestjs/common';
import { ChatService as AppChatService } from '../chat/chat.service';
import { ChatRequestDto } from '../chat/dto/chat-request.dto';
import { ChatResponseDto } from '../chat/dto/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly appChatService: AppChatService) {}

  /**
   * Process a user message and prepare it for agent processing
   */
  async processMessage(sessionId: string, message: string): Promise<string> {
    this.logger.log(`Processing message for session ${sessionId}: ${message}`);

    try {
      const chatRequest: ChatRequestDto = {
        sessionId,
        message,
      };

      const response: ChatResponseDto = await this.appChatService.processMessage(chatRequest);

      // If there's an app URL, include it in the response
      if (response.appUrl) {
        return `${response.reply}\n\nApp URL: ${response.appUrl}`;
      }

      return response.reply;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error processing message: ${error.message}`);
        return `Sorry, there was an error processing your message: ${error.message}`;
      }
      this.logger.error('Unknown error occurred');
      return 'Sorry, an unexpected error occurred while processing your message';
    }
  }

  /**
   * Stream a response to the client
   */
  async streamResponse(sessionId: string, message: string): Promise<string[]> {
    // This is a placeholder for streaming responses
    // In the future, this will stream tokens from the agent system
    await new Promise((resolve) => setTimeout(resolve, 100)); // Mock async operation
    return message.split(' ').map((word) => word + ' ');
  }
}
