import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

import { CoordinatorAgentService } from '../../agents/coordinator-agent/coordinator-agent.service';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly coordinatorService: CoordinatorAgentService,
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async processMessage(chatRequestDto: ChatRequestDto, userId: string): Promise<ChatResponseDto> {
    const { chatSessionId, message } = chatRequestDto;

    // Verify chat session ownership
    const chatSession = await this.prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      select: { id: true, userId: true },
    });

    if (!chatSession) {
      throw new NotFoundException(`Session with ID ${chatSessionId} not found`);
    }

    if (chatSession.userId !== userId) {
      throw new ForbiddenException(`You don't have access to this chat session`);
    }

    const result = await this.coordinatorService.run({ message, chatSessionId });
    await this.updateSessionTitle(chatSessionId, result.reply);

    return {
      chatSessionId,
      reply: result.reply,
    };
  }

  private async updateSessionTitle(chatSessionId: string, message: string) {
    const chatSession = await this.prisma.chatSession.findUnique({
      where: { id: chatSessionId },
    });

    if (!chatSession) {
      throw new NotFoundException(`Session with ID ${chatSessionId} not found`);
    }

    // Count the total messages in the session
    const messagesCount = await this.prisma.message.count({
      where: { chatSessionId },
    });

    // Only update title if this is a new session (2 messages: 1 from user, 1 from AI)
    if (messagesCount !== 1) {
      this.logger.debug(
        `Skipping title update for session ${chatSessionId} with ${messagesCount} messages`,
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
      where: { id: chatSessionId },
      data: { title: titleResponse.content },
    });

    this.logger.log(`Updated title for session ${chatSessionId} to: ${titleResponse.content}`);
    this.eventEmitter.emit('session.title.updated', {
      chatSessionId,
      title: titleResponse.content,
    });
  }
}
