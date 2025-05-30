import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from 'src/modules/chat/dto/chat-message.dto';
import { ChatMessageService } from 'src/modules/chat/services/chat-message.service';

import { ChatMessage } from '../../types';

@Injectable()
export class ChatContextService {
  private readonly logger = new Logger(ChatContextService.name);

  constructor(private readonly chatMessageService: ChatMessageService) {}

  /**
   * Get the chat context for a session
   * @param chatSessionId The session ID
   * @param userId The user ID who owns the chat session
   * @returns The chat context as an array of messages
   */
  public async getChatContext(chatSessionId: string, userId: string): Promise<Array<ChatMessage>> {
    const savedMessages = await this.chatMessageService.findAllBySessionId(chatSessionId, userId);

    return savedMessages.map((message) => ({
      role: message.role === MessageRole.USER ? ('user' as const) : ('assistant' as const),
      content: message.content,
    }));
  }
}
