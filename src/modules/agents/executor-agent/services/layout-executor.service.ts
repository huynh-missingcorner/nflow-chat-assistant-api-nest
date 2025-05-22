import { Injectable } from '@nestjs/common';
import { NFlowLayoutService } from 'src/modules/nflow/services/layout.service';
import { CreateLayoutDto, LayoutResponse } from 'src/modules/nflow/types';
import { MemoryService } from 'src/modules/memory/memory.service';
import { BaseExecutorService } from './base-executor.service';
import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { ShortTermMemory } from 'src/modules/memory/types';

@Injectable()
export class LayoutExecutorService extends BaseExecutorService {
  constructor(
    private readonly layoutService: NFlowLayoutService,
    memoryService: MemoryService,
    chatSessionService: ChatSessionService,
  ) {
    super(memoryService, chatSessionService);
  }

  /**
   * Create a layout in NFlow
   * @param data Layout data
   * @param chatSessionId Chat session ID to track context
   * @returns Layout response from NFlow
   */
  async createLayout(data: CreateLayoutDto, chatSessionId: string): Promise<LayoutResponse> {
    const userId = await this.getUserId(chatSessionId);
    const layoutResponse = await this.layoutService.createLayout(data, userId);

    await this.updateMemory<ShortTermMemory>(chatSessionId, (memory) => ({
      ...memory,
      createdLayouts: [...(memory.createdLayouts || []), layoutResponse],
    }));

    return layoutResponse;
  }
}
