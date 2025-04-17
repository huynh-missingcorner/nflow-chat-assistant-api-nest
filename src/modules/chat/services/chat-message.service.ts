import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async create(createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    try {
      const { sessionId, content, role } = createMessageDto;

      const session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      const message = await this.prisma.message.create({
        data: {
          content,
          role: this.mapMessageRoleToPrisma(role),
          session: {
            connect: { id: sessionId },
          },
        },
      });

      this.logger.log(`Created message with ID: ${message.id}`);

      return {
        id: message.id,
        sessionId: message.sessionId,
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

  async findAll(): Promise<MessageResponseDto[]> {
    try {
      const messages = await this.prisma.message.findMany({
        orderBy: { createdAt: 'asc' },
      });

      return messages.map((message) => ({
        id: message.id,
        sessionId: message.sessionId,
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

  async findAllBySessionId(sessionId: string): Promise<MessageResponseDto[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      });

      return messages.map((message) => ({
        id: message.id,
        sessionId: message.sessionId,
        content: message.content,
        role: this.mapPrismaRoleToMessageRole(message.role),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch messages for session ${sessionId}`, error);
      throw error;
    }
  }

  async findOne(id: string): Promise<MessageResponseDto> {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
      });

      if (!message) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }

      return {
        id: message.id,
        sessionId: message.sessionId,
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

  async update(id: string, updateMessageDto: UpdateMessageDto): Promise<MessageResponseDto> {
    try {
      const message = await this.prisma.message.update({
        where: { id },
        data: updateMessageDto,
      });

      return {
        id: message.id,
        sessionId: message.sessionId,
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

  async remove(id: string): Promise<boolean> {
    try {
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

  async removeAllBySessionId(sessionId: string): Promise<number> {
    try {
      const result = await this.prisma.message.deleteMany({
        where: { sessionId },
      });

      this.logger.log(`Removed ${result.count} messages for session ID: ${sessionId}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to delete messages for session ID ${sessionId}`, error);
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
