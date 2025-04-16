import { Injectable, NotFoundException } from '@nestjs/common';
import { CoordinatorService } from '../../agents/coordinator-agent/coordinator.service';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly coordinatorService: CoordinatorService,
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process a chat message and return a response
   * @param chatRequestDto The chat request data
   * @returns Chat response with AI reply and app URL if available
   */
  async processMessage(chatRequestDto: ChatRequestDto): Promise<ChatResponseDto> {
    const { sessionId, message } = chatRequestDto;
    const result = await this.coordinatorService.processUserMessage(message, sessionId);
    await this.updateSessionTitle(sessionId, result.reply);

    return {
      sessionId,
      reply: result.reply,
    };
  }

  private async updateSessionTitle(sessionId: string, message: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Count the total messages in the session
    const messagesCount = await this.prisma.message.count({
      where: { sessionId },
    });

    // Only update title if this is a new session (2 messages: 1 from user, 1 from AI)
    if (messagesCount !== 1) {
      this.logger.debug(
        `Skipping title update for session ${sessionId} with ${messagesCount} messages`,
      );
      return;
    }

    // Update the session title based on the first user message by using OpenAI
    const titleResponse = await this.openaiService.generateChatCompletion([
      {
        role: 'system',
        content: `Generate a short, concise title (maximum 6 words) for a chat conversation that starts with this user message, only the text, no quotes: "${message}"`,
      },
    ]);

    if (!titleResponse.content) {
      throw new Error('Failed to generate title');
    }

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: titleResponse.content },
    });

    this.logger.log(`Updated title for session ${sessionId} to: ${titleResponse.content}`);

    // Emit a session.title.updated event
    this.eventEmitter.emit('session.title.updated', { sessionId, title: titleResponse.content });
  }
}
