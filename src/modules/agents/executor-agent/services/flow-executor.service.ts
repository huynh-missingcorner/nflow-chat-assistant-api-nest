import { Injectable } from '@nestjs/common';
import { MemoryService } from 'src/modules/memory/memory.service';
import { FlowCreateDto, FlowResponse } from 'src/modules/nflow/types';
import { NFlowFlowService } from 'src/modules/nflow/services/flow.service';
import { BaseExecutorService } from './base-executor.service';
import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { ShortTermMemory } from 'src/modules/memory/types';

@Injectable()
export class FlowExecutorService extends BaseExecutorService {
  constructor(
    private readonly flowService: NFlowFlowService,
    memoryService: MemoryService,
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
