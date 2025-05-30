import { Inject, Injectable } from '@nestjs/common';
import { ShortTermMemory } from 'src/modules/memory/types';
import { NFlowLayoutService } from 'src/modules/nflow/services/layout.service';
import { CreateLayoutDto, LayoutResponse } from 'src/modules/nflow/types';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { MEMORY_SERVICE } from '@/modules/memory/const';
import { IMemoryService } from '@/modules/memory/interfaces';

import { BaseExecutorService } from './base-executor.service';

@Injectable()
export class LayoutExecutorService extends BaseExecutorService {
  constructor(
    private readonly layoutService: NFlowLayoutService,
    @Inject(MEMORY_SERVICE) protected readonly memoryService: IMemoryService,
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
