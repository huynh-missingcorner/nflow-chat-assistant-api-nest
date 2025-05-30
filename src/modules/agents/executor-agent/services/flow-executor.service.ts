import { Inject, Injectable } from '@nestjs/common';
import { ShortTermMemory } from 'src/modules/memory/types';
import { NFlowFlowService } from 'src/modules/nflow/services/flow.service';
import { FlowCreateDto, FlowResponse } from 'src/modules/nflow/types';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { MEMORY_SERVICE } from '@/modules/memory/const';
import { IMemoryService } from '@/modules/memory/interfaces';

import { BaseExecutorService } from './base-executor.service';

@Injectable()
export class FlowExecutorService extends BaseExecutorService {
  constructor(
    private readonly flowService: NFlowFlowService,
    @Inject(MEMORY_SERVICE) protected readonly memoryService: IMemoryService,
    chatSessionService: ChatSessionService,
  ) {
    super(memoryService, chatSessionService);
  }

  /**
   * Create a flow in NFlow
   * @param data Flow data
   * @param chatSessionId Chat session ID to track context
   * @returns Flow response from NFlow
   */
  async createFlow(data: FlowCreateDto, chatSessionId: string): Promise<FlowResponse> {
    const userId = await this.getUserId(chatSessionId);
    const flowResponse = await this.flowService.createFlow(data, userId);

    await this.updateMemory<ShortTermMemory>(chatSessionId, (memory) => ({
      ...memory,
      createdFlows: [...(memory.createdFlows || []), flowResponse],
    }));

    return flowResponse;
  }
}
