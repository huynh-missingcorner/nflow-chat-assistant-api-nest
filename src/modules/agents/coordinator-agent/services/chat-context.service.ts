import { Injectable, Logger } from '@nestjs/common';

import { ChatMessage } from '@/modules/agents/types';
import { MessageRole } from '@/modules/chat/dto/chat-message.dto';
import { ChatMessageService } from '@/modules/chat/services/chat-message.service';

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
