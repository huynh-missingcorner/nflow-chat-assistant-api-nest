import { Injectable } from '@nestjs/common';
import { CoordinatorService } from '../coordinator/coordinator.service';
import { HistoryService } from '../history/history.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly coordinatorService: CoordinatorService,
    private readonly historyService: HistoryService,
  ) {}

  /**
   * Process a chat message and return a response
   * @param chatRequestDto The chat request data
   * @returns Chat response with AI reply and app URL if available
   */
  async processMessage(chatRequestDto: ChatRequestDto): Promise<ChatResponseDto> {
    const { sessionId, message } = chatRequestDto;
    // const chatContext = await this.historyService.getSessionHistory(sessionId);
    const result = await this.coordinatorService.processUserMessage(message);
    // await this.historyService.saveInteraction(sessionId, message, result.reply);

    return {
      sessionId,
      reply: result.reply,
      appUrl: result.appUrl || undefined,
    };
  }
}
