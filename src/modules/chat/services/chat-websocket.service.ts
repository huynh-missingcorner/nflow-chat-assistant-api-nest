import { Injectable, Logger } from '@nestjs/common';

import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatService } from './chat.service';

@Injectable()
export class ChatWebsocketService {
  private readonly logger = new Logger(ChatWebsocketService.name);

  constructor(private readonly chatService: ChatService) {}

  async processMessage(chatSessionId: string, message: string, userId: string): Promise<string> {
    this.logger.log(`Processing WebSocket message for session ${chatSessionId}: ${message}`);

    try {
      const chatRequest: ChatRequestDto = {
        chatSessionId: chatSessionId,
        message,
      };

      const response = await this.chatService.processMessage(chatRequest, userId);

      // If there's an app URL, include it in the response
      if (response.appUrl) {
        return `${response.reply}\n\nApp URL: ${response.appUrl}`;
      }

      return response.reply;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error processing WebSocket message: ${error.message}`);
        return `Sorry, there was an error processing your message: ${error.message}`;
      }
      this.logger.error('Unknown error occurred processing WebSocket message');
      return 'Sorry, an unexpected error occurred while processing your message';
    }
  }

  async streamResponse(chatSessionId: string, message: string): Promise<string[]> {
    this.logger.debug(`Streaming response for session ${chatSessionId}`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Mock async operation
    return message.split(' ').map((word) => word + ' ');
  }
}
