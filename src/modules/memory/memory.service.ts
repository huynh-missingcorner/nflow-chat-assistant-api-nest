import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatedObject, ShortTermMemory } from './types';
import { ChatContextService } from '../agents/coordinator-agent/services/chat-context.service';
import { ExecutionResult } from '../agents/executor-agent/types/executor.types';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly REDIS_PREFIX = 'memory:chat-session:';
  private readonly SESSION_TTL = 60 * 60 * 24 * 7; // 1 week in seconds

  constructor(
    private readonly chatContextService: ChatContextService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  public async getContext(chatSessionId: string): Promise<ShortTermMemory> {
    const redisKey = this.getRedisKey(chatSessionId);
    let context = await this.redisService.get<ShortTermMemory>(redisKey);

    if (!context) {
      const chatSession = await this.prisma.chatSession.findUnique({
        where: { id: chatSessionId },
        select: { userId: true },
      });

      if (!chatSession) {
        throw new NotFoundException(`Chat session with ID ${chatSessionId} not found`);
      }

      const chatHistory = await this.chatContextService.getChatContext(
        chatSessionId,
        chatSession.userId,
      );

      context = {
        chatSessionId,
        chatHistory,
        createdApplications: [],
        createdObjects: [],
        createdLayouts: [],
        createdFlows: [],
        toolCallsLog: [],
        taskResults: {},
        pendingHITL: [],
        timestamp: new Date(),
      };

      await this.redisService.set(redisKey, context, this.SESSION_TTL);
      this.logger.debug(`Created new session context for ${chatSessionId}`);
    }

    return context;
  }

  public async patch(
    context: ShortTermMemory,
    patchData: Partial<ShortTermMemory>,
  ): Promise<ShortTermMemory> {
    const updatedContext = {
      ...context,
      ...patchData,
      timestamp: new Date(),
    };

    const redisKey = this.getRedisKey(context.chatSessionId);
    await this.redisService.set(redisKey, updatedContext, this.SESSION_TTL);
    this.logger.debug(`Updated session context for ${context.chatSessionId}`);

    return updatedContext;
  }

  public async reset(chatSessionId: string): Promise<void> {
    const redisKey = this.getRedisKey(chatSessionId);
    await this.redisService.del(redisKey);
    this.logger.debug(`Reset session context for ${chatSessionId}`);
  }

  public findObjectByName(context: ShortTermMemory, objectName: string): CreatedObject | undefined {
    return context.createdObjects.find(
      (obj) => obj.name.toLowerCase() === objectName.toLowerCase(),
    );
  }

  public getLastCreatedApplication(
    context: ShortTermMemory,
  ): ShortTermMemory['createdApplications'] {
    return context.createdApplications;
  }

  public async updateTaskResults(chatSessionId: string, results: ExecutionResult): Promise<void> {
    const context = await this.getContext(chatSessionId);

    context.taskResults = {
      ...context.taskResults,
      [results.id]: results,
    };

    const redisKey = this.getRedisKey(chatSessionId);
    await this.redisService.set(redisKey, context, this.SESSION_TTL);
    this.logger.debug(`Updated task results for session ${chatSessionId}`);
  }

  private getRedisKey(chatSessionId: string): string {
    return `${this.REDIS_PREFIX}${chatSessionId}`;
  }
}
