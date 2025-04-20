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

    // Update the short term memory
    const shortTermMemory = await this.memoryService.getContext(sessionId);
    const existingObject = shortTermMemory.createdObjects.find(
      (object) => object.name === objectResponse.name,
    );
    if (existingObject) {
      shortTermMemory.createdObjects = shortTermMemory.createdObjects.map((object) =>
        object.name === objectResponse.name ? { ...object, ...objectResponse } : object,
      );
    } else {
      shortTermMemory.createdObjects.push({
        ...objectResponse,
        fields: [],
      });
    }

    return objectResponse;
  }

  async changeField(data: FieldDto, sessionId: string): Promise<FieldResponse> {
    const fieldResponse = await this.objectService.changeField(data);

    // Update the short term memory
    const shortTermMemory = await this.memoryService.getContext(sessionId);
    const existingObject = shortTermMemory.createdObjects.find(
      (object) => object.name === data.objName,
    );
    if (existingObject) {
      const existingField = existingObject.fields.find((field) => field.name === data.name);
      if (existingField) {
        existingObject.fields = existingObject.fields.map((field) =>
          field.name === data.name ? { ...field, ...fieldResponse } : field,
        );
      } else {
        existingObject.fields.push(fieldResponse);
      }
    } else {
      throw new Error('Object not found in short term memory');
    }
    return fieldResponse;
  }
}
