import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatedObject, Field, ShortTermMemory } from './types';
import { ChatContextService } from '../agents/coordinator-agent/services/chat-context.service';
import { ExecutionResult } from '../agents/executor-agent/types/executor.types';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import merge from 'lodash.merge';
import { IMemoryService } from './interfaces/memory-service.interface';
import {
  getRedisKey,
  findObjectByName,
  findFieldByName,
  getCreatedApplications,
  createInitialContext,
  SESSION_TTL,
} from './utils/memory-key.util';

@Injectable()
export class MemoryService implements IMemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private readonly chatContextService: ChatContextService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  public async getContext(chatSessionId: string): Promise<ShortTermMemory> {
    const redisKey = getRedisKey(chatSessionId);
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

      context = createInitialContext(chatSessionId, chatHistory);

      await this.redisService.set(redisKey, context, SESSION_TTL);
      this.logger.debug(`Created new session context for ${chatSessionId}`);
    }

    return context;
  }

  public async updateContext(
    context: ShortTermMemory,
    patchData: Partial<ShortTermMemory>,
  ): Promise<ShortTermMemory> {
    const updatedContext = merge({}, context, patchData, {
      timestamp: new Date(),
    });

    const redisKey = getRedisKey(context.chatSessionId);
    await this.redisService.set(redisKey, updatedContext, SESSION_TTL);
    this.logger.debug(`Updated session context for ${context.chatSessionId}`);

    return updatedContext;
  }

  public async getField<T extends keyof ShortTermMemory>(
    chatSessionId: string,
    field: T,
  ): Promise<ShortTermMemory[T]> {
    const context = await this.getContext(chatSessionId);
    return context[field];
  }

  public async setField<T extends keyof ShortTermMemory>(
    chatSessionId: string,
    field: T,
    value: ShortTermMemory[T],
  ): Promise<void> {
    const context = await this.getContext(chatSessionId);
    const updatedContext = { ...context, [field]: value, timestamp: new Date() };
    const redisKey = getRedisKey(chatSessionId);
    await this.redisService.set(redisKey, updatedContext, SESSION_TTL);
    this.logger.debug(`Updated session context for ${chatSessionId} field ${field}`);
  }

  public async appendToFieldArray<K extends keyof ShortTermMemory>(
    chatSessionId: string,
    field: K,
    item: ShortTermMemory[K] extends Array<infer U> ? U : never,
  ): Promise<void> {
    const context = await this.getContext(chatSessionId);
    const currentArray = context[field];

    if (!Array.isArray(currentArray)) {
      throw new Error(`Field "${String(field)}" is not an array.`);
    }

    const updatedArray = [...currentArray, item] as ShortTermMemory[K];
    await this.setField(chatSessionId, field, updatedArray);
  }

  public async reset(chatSessionId: string): Promise<void> {
    const redisKey = getRedisKey(chatSessionId);
    await this.redisService.del(redisKey);
    this.logger.debug(`Reset session context for ${chatSessionId}`);
  }

  public findObjectByName(context: ShortTermMemory, objectName: string): CreatedObject | undefined {
    return findObjectByName(context, objectName);
  }

  public getLastCreatedApplication(
    context: ShortTermMemory,
  ): ShortTermMemory['createdApplications'] {
    return getCreatedApplications(context);
  }

  public async updateTaskResults(chatSessionId: string, results: ExecutionResult): Promise<void> {
    const context = await this.getContext(chatSessionId);

    context.taskResults = {
      ...context.taskResults,
      [results.id]: results,
    };

    const redisKey = getRedisKey(chatSessionId);
    await this.redisService.set(redisKey, context, SESSION_TTL);
    this.logger.debug(`Updated task results for session ${chatSessionId}`);
  }

  public findFieldByName(
    context: ShortTermMemory,
    objectName: string,
    fieldName: string,
  ): Field | undefined {
    return findFieldByName(context, objectName, fieldName);
  }
}
