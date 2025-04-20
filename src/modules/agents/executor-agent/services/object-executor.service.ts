import { Injectable } from '@nestjs/common';
import { NFlowObjectService } from 'src/modules/nflow/services/object.service';
import { MemoryService } from 'src/modules/memory/memory.service';
import { FieldDto, FieldResponse, ObjectDto } from 'src/modules/nflow/types';
import { ObjectResponse } from 'src/modules/nflow/types';

@Injectable()
export class ObjectExecutorService {
  constructor(
    private readonly objectService: NFlowObjectService,
    private readonly memoryService: MemoryService,
  ) {}

  async changeObject(data: ObjectDto, sessionId: string): Promise<ObjectResponse> {
    const objectResponse = await this.objectService.changeObject(data);

    const shortTermMemory = await this.memoryService.getContext(sessionId);
    this.memoryService.patch(shortTermMemory, {
      createdObjects: shortTermMemory.createdObjects.map((object) =>
        object.name === objectResponse.name ? { ...object, ...objectResponse } : object,
      ),
    });

    return objectResponse;
  }

  async changeField(data: FieldDto, sessionId: string): Promise<FieldResponse> {
    const fieldResponse = await this.objectService.changeField(data);

    const shortTermMemory = await this.memoryService.getContext(sessionId);
    this.memoryService.patch(shortTermMemory, {
      createdObjects: shortTermMemory.createdObjects.map((object) =>
        object.name === data.objName
          ? {
              ...object,
              fields: object.fields.map((field) =>
                field.name === data.name ? { ...field, ...fieldResponse } : field,
              ),
            }
          : object,
      ),
    });

    return fieldResponse;
  }
}
