import { Inject, Injectable } from '@nestjs/common';

import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { MEMORY_SERVICE } from '@/modules/memory/const';
import { IMemoryService } from '@/modules/memory/interfaces';
import { CreatedApplication, ShortTermMemory } from '@/modules/memory/types';
import { NFlowApplicationService } from '@/modules/nflow/services/application.service';
import { BuilderAppResponse } from '@/modules/nflow/types';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from '@/modules/nflow/types/application.types';

import { BaseExecutorService } from './base-executor.service';

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
