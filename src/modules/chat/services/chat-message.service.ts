import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  CreateMessageDto,
  MessageResponseDto,
  UpdateMessageDto,
  MessageRole,
} from '../dto/chat-message.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(ChatMessageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, userId: string): Promise<MessageResponseDto> {
    try {
      const { chatSessionId, content, role } = createMessageDto;

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

      const message = await this.prisma.message.create({
        data: {
          content,
          role: this.mapMessageRoleToPrisma(role),
          chatSession: {
            connect: { id: chatSessionId },
          },
        },
      });

      this.logger.log(`Created message with ID: ${message.id}`);

      return {
        id: message.id,
        chatSessionId: message.chatSessionId,
        content: message.content,
        role: this.mapPrismaRoleToMessageRole(message.role),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    } catch (error) {
      this.logger.error('Failed to create message', error);
      throw error;
    }
  }

  async findAll(userId: string): Promise<MessageResponseDto[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          chatSession: {
            userId,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return messages.map((message) => ({
        id: message.id,
        chatSessionId: message.chatSessionId,
        content: message.content,
        role: this.mapPrismaRoleToMessageRole(message.role),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch messages', error);
      throw error;
    }
  }

  async findAllBySessionId(chatSessionId: string, userId: string): Promise<MessageResponseDto[]> {
    try {
      // First verify chat session ownership
      const chatSession = await this.prisma.chatSession.findUnique({
        where: { id: chatSessionId },
        select: { id: true, userId: true },
      });

      if (!chatSession) {
        throw new NotFoundException(`Chat session with ID ${chatSessionId} not found`);
      }

      if (chatSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this chat session`);
      }

      const messages = await this.prisma.message.findMany({
        where: { chatSessionId },
        orderBy: { createdAt: 'asc' },
      });

      return messages.map((message) => ({
        id: message.id,
        chatSessionId: message.chatSessionId,
        content: message.content,
        role: this.mapPrismaRoleToMessageRole(message.role),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch messages for session ${chatSessionId}`, error);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<MessageResponseDto> {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
        include: {
          chatSession: {
            select: { userId: true },
          },
        },
      });

      if (!message) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }

      if (message.chatSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this message`);
      }

      return {
        id: message.id,
        chatSessionId: message.chatSessionId,
        content: message.content,
        role: this.mapPrismaRoleToMessageRole(message.role),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch message with ID ${id}`, error);
      throw error;
    }
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    userId: string,
  ): Promise<MessageResponseDto> {
    try {
      // First verify message ownership via chat session
      const existingMessage = await this.prisma.message.findUnique({
        where: { id },
        include: {
          chatSession: {
            select: { userId: true },
          },
        },
      });

      if (!existingMessage) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }

      if (existingMessage.chatSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this message`);
      }

      const message = await this.prisma.message.update({
        where: { id },
        data: updateMessageDto,
      });

      return {
        id: message.id,
        chatSessionId: message.chatSessionId,
        content: message.content,
        role: this.mapPrismaRoleToMessageRole(message.role),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update message with ID ${id}`, error);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<boolean> {
    try {
      // First verify message ownership via chat session
      const existingMessage = await this.prisma.message.findUnique({
        where: { id },
        include: {
          chatSession: {
            select: { userId: true },
          },
        },
      });

      if (!existingMessage) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }

      if (existingMessage.chatSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this message`);
      }

      await this.prisma.message.delete({
        where: { id },
      });

      this.logger.log(`Removed message with ID: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete message with ID ${id}`, error);
      throw error;
    }
  }

  async removeAllBySessionId(chatSessionId: string, userId: string): Promise<number> {
    try {
      // First verify chat session ownership
      const chatSession = await this.prisma.chatSession.findUnique({
        where: { id: chatSessionId },
        select: { id: true, userId: true },
      });

      if (!chatSession) {
        throw new NotFoundException(`Chat session with ID ${chatSessionId} not found`);
      }

      if (chatSession.userId !== userId) {
        throw new ForbiddenException(`You don't have access to this chat session`);
      }

      const result = await this.prisma.message.deleteMany({
        where: { chatSessionId },
      });

      this.logger.log(`Removed ${result.count} messages for session ID: ${chatSessionId}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to delete messages for session ID ${chatSessionId}`, error);
      throw error;
    }
  }

  private mapMessageRoleToPrisma(role: MessageRole): Role {
    switch (role) {
      case MessageRole.USER:
        return Role.USER;
      case MessageRole.ASSISTANT:
        return Role.ASSISTANT;
      case MessageRole.SYSTEM:
        return Role.SYSTEM;
      default:
        return Role.USER;
    }
  }

  private mapPrismaRoleToMessageRole(role: Role): MessageRole {
    switch (role) {
      case Role.USER:
        return MessageRole.USER;
      case Role.ASSISTANT:
        return MessageRole.ASSISTANT;
      case Role.SYSTEM:
        return MessageRole.SYSTEM;
      default:
        return MessageRole.USER;
    }
  }
}
