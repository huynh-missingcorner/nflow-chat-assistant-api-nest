import { Injectable, Logger } from '@nestjs/common';
import { ChatMessageService } from 'src/modules/chat/services/chat-message.service';
import { MessageRole } from 'src/modules/chat/dto/chat-message.dto';
import { ChatMessage } from '../../types';

@Injectable()
export class ChatContextService {
  private readonly logger = new Logger(ChatContextService.name);

  constructor(private readonly chatMessageService: ChatMessageService) {}

  /**
   * Get the chat context for a session
   * @param sessionId The session ID
   * @returns The chat context as an array of messages
   */
  public async getChatContext(sessionId: string): Promise<Array<ChatMessage>> {
    const savedMessages = await this.chatMessageService.findAllBySessionId(sessionId);

    return savedMessages.map((message) => ({
      role: message.role === MessageRole.USER ? ('user' as const) : ('assistant' as const),
      content: message.content,
    }));
  }
}
