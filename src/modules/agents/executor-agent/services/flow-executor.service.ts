import { Injectable } from '@nestjs/common';
import { MemoryService } from 'src/modules/memory/memory.service';
import { FlowCreateDto, FlowResponse } from 'src/modules/nflow/types';
import { NFlowFlowService } from 'src/modules/nflow/services/flow.service';

@Injectable()
export class FlowExecutorService {
  constructor(
    private readonly flowService: NFlowFlowService,
    private readonly memoryService: MemoryService,
  ) {}

  async createFlow(data: FlowCreateDto, chatSessionId: string): Promise<FlowResponse> {
    const flowResponse = await this.flowService.createFlow(data);

    const shortTermMemory = await this.memoryService.getContext(chatSessionId);
    await this.memoryService.patch(shortTermMemory, {
      createdFlows: [...(shortTermMemory.createdFlows || []), flowResponse],
    });

    return flowResponse;
  }
}
