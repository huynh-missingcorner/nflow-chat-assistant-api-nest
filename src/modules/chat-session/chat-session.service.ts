import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { UpdateChatSessionDto } from './dto/update-chat-session.dto';

@Injectable()
export class ChatSessionService {
  private readonly logger = new Logger(ChatSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createChatSessionDto: CreateChatSessionDto, userId: string) {
    try {
      return await this.prisma.chatSession.create({
        data: {
          ...createChatSessionDto,
          userId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create chat session', error);
      throw error;
    }
  }

  async findAll(userId: string) {
    try {
      return await this.prisma.chatSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch chat sessions', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const chatSession = await this.prisma.chatSession.findUnique({
        where: { id },
        include: {
          messages: true,
          generatedApp: true,
        },
      });

      if (!chatSession) {
        throw new NotFoundException(`Chat session with ID ${id} not found`);
      }

      if (chatSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this chat session`);
      }

      return chatSession;
    } catch (error) {
      this.logger.error(`Failed to fetch chat session with ID ${id}`, error);
      throw error;
    }
  }

  async update(id: string, updateChatSessionDto: UpdateChatSessionDto, userId: string) {
    try {
      // First verify ownership
      const existingSession = await this.prisma.chatSession.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingSession) {
        throw new NotFoundException(`Chat session with ID ${id} not found`);
      }

      if (existingSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this chat session`);
      }

      return await this.prisma.chatSession.update({
        where: { id },
        data: updateChatSessionDto,
      });
    } catch (error) {
      this.logger.error(`Failed to update chat session with ID ${id}`, error);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      // First verify ownership
      const existingSession = await this.prisma.chatSession.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingSession) {
        throw new NotFoundException(`Chat session with ID ${id} not found`);
      }

      if (existingSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this chat session`);
      }

      return await this.prisma.chatSession.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete chat session with ID ${id}`, error);
      throw error;
    }
  }
}
