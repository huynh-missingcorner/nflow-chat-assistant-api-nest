import { Inject, Injectable } from '@nestjs/common';
import { NFlowApplicationService } from 'src/modules/nflow/services/application.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from 'src/modules/nflow/types/application.types';
import { BuilderAppResponse } from 'src/modules/nflow/types';
import { BaseExecutorService } from './base-executor.service';
import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { CreatedApplication, ShortTermMemory } from 'src/modules/memory/types';
import { IMemoryService } from '@/modules/memory/interfaces/memory-service.interface';
import { MEMORY_SERVICE } from '@/modules/memory/const';

@Injectable()
export class AppExecutorService extends BaseExecutorService {
  constructor(
    private readonly applicationService: NFlowApplicationService,
    @Inject(MEMORY_SERVICE) protected readonly memoryService: IMemoryService,
    chatSessionService: ChatSessionService,
  ) {
    super(memoryService, chatSessionService);
  }

  /**
   * Create an application in NFlow
   * @param data Application data
   * @param chatSessionId Chat session ID to track the context
   * @returns Created application response
   */
  async createApp(data: CreateApplicationDto, chatSessionId: string): Promise<BuilderAppResponse> {
    const userId = await this.getUserId(chatSessionId);
    const appResponse = await this.applicationService.createApp(data, userId);

    await this.updateMemory<ShortTermMemory>(chatSessionId, (memory) => ({
      ...memory,
      createdApplications: [
        ...memory.createdApplications,
        {
          id: appResponse.id,
          name: appResponse.name,
          displayName: appResponse.displayName,
          description: appResponse.description,
        },
      ],
    }));

    return appResponse;
  }

  /**
   * Update an application in NFlow
   * @param data Application data to update
   * @param chatSessionId Chat session ID to track the context
   * @returns Updated application response
   */
  async updateApp(data: UpdateApplicationDto, chatSessionId: string): Promise<BuilderAppResponse> {
    const userId = await this.getUserId(chatSessionId);
    const appResponse = await this.applicationService.updateApp(data, userId);

    await this.updateMemory<ShortTermMemory>(chatSessionId, (memory) => ({
      ...memory,
      createdApplications: memory.createdApplications.map((app: CreatedApplication) =>
        app.name === data.name
          ? {
              id: appResponse.id,
              name: appResponse.name,
              displayName: appResponse.displayName,
              description: appResponse.description,
            }
          : app,
      ),
    }));

    return appResponse;
  }
}
