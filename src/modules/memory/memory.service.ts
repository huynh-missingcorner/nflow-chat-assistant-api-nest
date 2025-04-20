import { Injectable, Logger } from '@nestjs/common';
import { CreatedObject, ShortTermMemory } from './types';
import { ChatContextService } from '../agents/coordinator-agent/services/chat-context.service';
import { ExecutionResult } from '../agents/executor-agent/types/executor.types';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly REDIS_PREFIX = 'memory:session:';
  private readonly SESSION_TTL = 60 * 60 * 24 * 7; // 1 week in seconds

  constructor(
    private readonly chatContextService: ChatContextService,
    private readonly redisService: RedisService,
  ) {}

  public async getContext(sessionId: string): Promise<ShortTermMemory> {
    const redisKey = this.getRedisKey(sessionId);
    let context = await this.redisService.get<ShortTermMemory>(redisKey);

    if (!context) {
      const chatHistory = await this.chatContextService.getChatContext(sessionId);

      context = {
        sessionId,
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
      this.logger.debug(`Created new session context for ${sessionId}`);
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

    const redisKey = this.getRedisKey(context.sessionId);
    await this.redisService.set(redisKey, updatedContext, this.SESSION_TTL);
    this.logger.debug(`Updated session context for ${context.sessionId}`);

    return updatedContext;
  }

  public async reset(sessionId: string): Promise<void> {
    const redisKey = this.getRedisKey(sessionId);
    await this.redisService.del(redisKey);
    this.logger.debug(`Reset session context for ${sessionId}`);
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

  public async updateTaskResults(sessionId: string, results: ExecutionResult): Promise<void> {
    const context = await this.getContext(sessionId);

    context.taskResults = {
      ...context.taskResults,
      [results.id]: results,
    };

    const redisKey = this.getRedisKey(sessionId);
    await this.redisService.set(redisKey, context, this.SESSION_TTL);
    this.logger.debug(`Updated task results for session ${sessionId}`);
  }

  private getRedisKey(sessionId: string): string {
    return `${this.REDIS_PREFIX}${sessionId}`;
  }
}
