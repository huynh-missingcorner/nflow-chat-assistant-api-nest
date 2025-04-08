import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import {
  CreateMessageDto,
  MessageResponseDto,
  UpdateMessageDto,
  MessageRole,
} from './dto/chat-message.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(ChatMessageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Map MessageRole (API enum) to Role (Prisma enum)
   */
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

  /**
   * Map Role (Prisma enum) to MessageRole (API enum)
   */
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

  /**
   * Create a new chat message
   * @param createMessageDto The message data
   * @returns The created message
   */
  async create(createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    try {
      const { sessionId, content, role } = createMessageDto;

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

  /**
   * Find all chat messages
   * @returns Array of messages
   */
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

  /**
   * Find all messages for a specific chat session
   * @param sessionId The chat session ID
   * @returns Array of messages for the session
   */
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

  /**
   * Find a message by ID
   * @param id The message ID
   * @returns The message if found
   */
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

  /**
   * Update a message
   * @param id The message ID
   * @param updateMessageDto The update data
   * @returns The updated message
   */
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

  /**
   * Delete a message
   * @param id The message ID
   * @returns True if the message was deleted
   */
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

  /**
   * Delete all messages for a chat session
   * @param sessionId The chat session ID
   * @returns The number of messages deleted
   */
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
}
