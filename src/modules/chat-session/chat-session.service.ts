import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { UpdateChatSessionDto } from './dto/update-chat-session.dto';

@Injectable()
export class ChatSessionService {
  private readonly logger = new Logger(ChatSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new chat session
   * @param createChatSessionDto The chat session data
   * @returns The created chat session
   */
  async create(createChatSessionDto: CreateChatSessionDto) {
    try {
      return await this.prisma.chatSession.create({
        data: createChatSessionDto,
      });
    } catch (error) {
      this.logger.error('Failed to create chat session', error);
      throw error;
    }
  }

  /**
   * Find all chat sessions
   * @returns Array of chat sessions
   */
  async findAll() {
    try {
      return await this.prisma.chatSession.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch chat sessions', error);
      throw error;
    }
  }

  /**
   * Find a chat session by ID
   * @param id The chat session ID
   * @returns The chat session if found
   */
  async findOne(id: string) {
    try {
      const session = await this.prisma.chatSession.findUnique({
        where: { id },
        include: {
          messages: true,
          generatedApp: true,
        },
      });

      if (!session) {
        throw new NotFoundException(`Chat session with ID ${id} not found`);
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to fetch chat session with ID ${id}`, error);
      throw error;
    }
  }

  /**
   * Update a chat session
   * @param id The chat session ID
   * @param updateChatSessionDto The update data
   * @returns The updated chat session
   */
  async update(id: string, updateChatSessionDto: UpdateChatSessionDto) {
    try {
      const session = await this.prisma.chatSession.update({
        where: { id },
        data: updateChatSessionDto,
      });

      if (!session) {
        throw new NotFoundException(`Chat session with ID ${id} not found`);
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to update chat session with ID ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a chat session
   * @param id The chat session ID
   * @returns The deleted chat session
   */
  async remove(id: string) {
    try {
      const session = await this.prisma.chatSession.delete({
        where: { id },
      });

      if (!session) {
        throw new NotFoundException(`Chat session with ID ${id} not found`);
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to delete chat session with ID ${id}`, error);
      throw error;
    }
  }
}
