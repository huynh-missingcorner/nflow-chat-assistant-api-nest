import { Injectable } from '@nestjs/common';
import { NFlowLayoutService } from 'src/modules/nflow/services/layout.service';
import { CreateLayoutDto, LayoutResponse } from 'src/modules/nflow/types';
import { MemoryService } from 'src/modules/memory/memory.service';

@Injectable()
export class LayoutExecutorService {
  constructor(
    private readonly layoutService: NFlowLayoutService,
    private readonly memoryService: MemoryService,
  ) {}

  async createLayout(data: CreateLayoutDto, sessionId: string): Promise<LayoutResponse> {
    const layoutResponse = await this.layoutService.createLayout(data);

    const shortTermMemory = await this.memoryService.getContext(sessionId);
    await this.memoryService.patch(shortTermMemory, {
      createdLayouts: [...(shortTermMemory.createdLayouts || []), layoutResponse],
    });

    return layoutResponse;
  }
}
