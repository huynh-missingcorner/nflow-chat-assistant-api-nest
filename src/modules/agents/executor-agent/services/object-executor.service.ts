import { Inject, Injectable } from '@nestjs/common';
import { NFlowObjectService } from 'src/modules/nflow/services/object.service';
import { FieldDto, FieldResponse, ObjectDto } from 'src/modules/nflow/types';
import { ObjectResponse } from 'src/modules/nflow/types';
import { BaseExecutorService } from './base-executor.service';
import { ChatSessionService } from '@/modules/chat-session/chat-session.service';
import { CreatedObject, Field, ShortTermMemory } from 'src/modules/memory/types';
import { IMemoryService } from '@/modules/memory/interfaces';
import { MEMORY_SERVICE } from '@/modules/memory/const';

@Injectable()
export class ObjectExecutorService extends BaseExecutorService {
  constructor(
    private readonly objectService: NFlowObjectService,
    @Inject(MEMORY_SERVICE) protected readonly memoryService: IMemoryService,
    chatSessionService: ChatSessionService,
  ) {
    super(memoryService, chatSessionService);
  }

  /**
   * Create, update, or delete an object in NFlow
   * @param data Object data with action to perform
   * @param chatSessionId Chat session ID to track context
   * @returns Object response from NFlow
   */
  async changeObject(data: ObjectDto, chatSessionId: string): Promise<ObjectResponse> {
    const userId = await this.getUserId(chatSessionId);
    const objectResponse = await this.objectService.changeObject(data, userId);

    await this.updateMemory<ShortTermMemory>(chatSessionId, (memory) => {
      const shortTermMemoryClone = structuredClone(memory);
      const existingObject = shortTermMemoryClone.createdObjects.find(
        (object: CreatedObject) => object.name === objectResponse.name,
      );

      if (data.action === 'delete') {
        shortTermMemoryClone.createdObjects = shortTermMemoryClone.createdObjects.filter(
          (object: CreatedObject) => object.name !== data.name,
        );
      } else if (existingObject) {
        shortTermMemoryClone.createdObjects = shortTermMemoryClone.createdObjects.map(
          (object: CreatedObject) =>
            object.name === objectResponse.name ? { ...object, ...objectResponse } : object,
        );
      } else {
        shortTermMemoryClone.createdObjects.push({
          ...objectResponse,
          fields: [],
        } as CreatedObject);
      }
      return shortTermMemoryClone;
    });

    return objectResponse;
  }

  /**
   * Create, update, or delete a field in an object
   * @param data Field data with action to perform
   * @param chatSessionId Chat session ID to track context
   * @returns Field response from NFlow
   */
  async changeField(data: FieldDto, chatSessionId: string): Promise<FieldResponse> {
    const userId = await this.getUserId(chatSessionId);
    const fieldResponse = await this.objectService.changeField(data, userId);

    await this.updateMemory<ShortTermMemory>(chatSessionId, (memory) => {
      const shortTermMemoryClone = structuredClone(memory);
      const existingObject = shortTermMemoryClone.createdObjects.find(
        (object: CreatedObject) => object.name === data.objName,
      );

      if (!existingObject) {
        throw new Error('Object not found in short term memory');
      }

      if (data.action === 'delete') {
        existingObject.fields = existingObject.fields.filter(
          (field: Field) => field.name !== data.name && field.name !== data.data.name,
        );
      } else {
        const existingField = existingObject.fields.find(
          (field: Field) => field.name === data.name,
        );
        if (existingField) {
          existingObject.fields = existingObject.fields.map((field: Field) =>
            field.name === data.name ? { ...field, ...fieldResponse } : field,
          );
        } else {
          existingObject.fields.push(fieldResponse as unknown as Field);
        }
      }

      return shortTermMemoryClone;
    });

    return fieldResponse;
  }

  /**
   * Get an object from NFlow
   * @param name Object name
   * @param chatSessionId Chat session ID to get user context
   * @returns Object response from NFlow
   */
  async getObject(name: string, chatSessionId: string): Promise<ObjectResponse> {
    const userId = await this.getUserId(chatSessionId);
    return this.objectService.getObject(name, userId);
  }

  /**
   * Get fields for an object from NFlow
   * @param name Object name
   * @param chatSessionId Chat session ID to get user context
   * @returns Array of field responses from NFlow
   */
  async getFieldsForObject(name: string, chatSessionId: string): Promise<FieldResponse[]> {
    const userId = await this.getUserId(chatSessionId);
    return this.objectService.getFieldsForObject(name, userId);
  }
}
