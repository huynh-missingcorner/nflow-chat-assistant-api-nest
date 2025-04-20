import { Injectable } from '@nestjs/common';
import { CreatedObject, ShortTermMemory } from './types';
import { ChatContextService } from '../agents/coordinator-agent/services/chat-context.service';
import { ExecutionResult } from '../agents/executor-agent/types/executor.types';

@Injectable()
export class MemoryService {
  private sessionContexts: Map<string, ShortTermMemory> = new Map();

  constructor(private readonly chatContextService: ChatContextService) {}

  public async getContext(sessionId: string): Promise<ShortTermMemory> {
    let context = this.sessionContexts.get(sessionId);

    if (!context) {
      const chatHistory = await this.chatContextService.getChatContext(sessionId);

      context = {
        sessionId,
        chatHistory,
        createdApplication: [],
        createdObjects: [],
        createdLayouts: [],
        createdFlows: [],
        toolCallsLog: [],
        taskResults: {},
        pendingClarifications: [],
        timestamp: new Date(),
      };

      this.sessionContexts.set(sessionId, context);
    }

    return context;
  }

  public patch(context: ShortTermMemory, patchData: Partial<ShortTermMemory>): ShortTermMemory {
    const updatedContext = {
      ...context,
      ...patchData,
      createdApplication: [
        ...(context.createdApplication || []),
        ...(patchData.createdApplication || []),
      ],
      createdObjects: [...(context.createdObjects || []), ...(patchData.createdObjects || [])],
      createdLayouts: [...(context.createdLayouts || []), ...(patchData.createdLayouts || [])],
      createdFlows: [...(context.createdFlows || []), ...(patchData.createdFlows || [])],
      toolCallsLog: [...(context.toolCallsLog || []), ...(patchData.toolCallsLog || [])],
      taskResults: { ...(context.taskResults || {}), ...(patchData.taskResults || {}) },
      timestamp: new Date(),
    };

    this.sessionContexts.set(context.sessionId, updatedContext);

    return updatedContext;
  }

  public reset(sessionId: string) {
    this.sessionContexts.delete(sessionId);
  }

  public findObjectByName(context: ShortTermMemory, objectName: string): CreatedObject | undefined {
    return context.createdObjects.find(
      (obj) => obj.name.toLowerCase() === objectName.toLowerCase(),
    );
  }

  public getLastCreatedApplication(
    context: ShortTermMemory,
  ): ShortTermMemory['createdApplication'] {
    return context.createdApplication;
  }

  public async updateTaskResults(sessionId: string, results: ExecutionResult): Promise<void> {
    const context = await this.getContext(sessionId);

    context.taskResults = {
      ...context.taskResults,
      [results.id]: results,
    };

    this.sessionContexts.set(sessionId, context);
  }
}
