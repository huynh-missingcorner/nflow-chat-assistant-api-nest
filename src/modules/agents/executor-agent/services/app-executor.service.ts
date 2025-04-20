import { Injectable } from '@nestjs/common';
import { NFlowApplicationService } from 'src/modules/nflow/services/application.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from 'src/modules/nflow/types/application.types';
import { BuilderAppResponse } from 'src/modules/nflow/types';
import { MemoryService } from 'src/modules/memory/memory.service';

@Injectable()
export class AppExecutorService {
  constructor(
    private readonly applicationService: NFlowApplicationService,
    private readonly memoryService: MemoryService,
  ) {}

  async createApp(data: CreateApplicationDto, sessionId: string): Promise<BuilderAppResponse> {
    const appResponse = await this.applicationService.createApp(data);

    const shortTermMemory = await this.memoryService.getContext(sessionId);
    this.memoryService.patch(shortTermMemory, {
      createdApplications: [
        ...shortTermMemory.createdApplications,
        {
          id: appResponse.id,
          name: appResponse.name,
          displayName: appResponse.displayName,
          description: appResponse.description,
        },
      ],
    });

    return appResponse;
  }

  async updateApp(data: UpdateApplicationDto, sessionId: string): Promise<BuilderAppResponse> {
    const appResponse = await this.applicationService.updateApp(data);

    const shortTermMemory = await this.memoryService.getContext(sessionId);
    this.memoryService.patch(shortTermMemory, {
      createdApplications: shortTermMemory.createdApplications.map((app) =>
        app.name === data.name
          ? {
              id: appResponse.id,
              name: appResponse.name,
              displayName: appResponse.displayName,
              description: appResponse.description,
            }
          : app,
      ),
    });

    return appResponse;
  }
}
