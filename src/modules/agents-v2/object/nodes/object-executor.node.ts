import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { updateObjectTool } from '../tools/update-object.tool';
import { ObjectExecutionResult, ObjectStateType } from '../types/object-graph-state.types';

type UpdateObjectResult = {
  success: boolean;
  objectId?: string;
  fieldIds?: string[];
  errors?: string[];
};

@Injectable()
export class ObjectExecutorNode {
  private readonly logger = new Logger(ObjectExecutorNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.EXECUTION_COMPLETED);

      const executionResult = await this.performExecution(state);

      if (executionResult.status === 'failed') {
        return {
          error: `Object execution failed: ${executionResult.errors?.join(', ')}`,
          currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
          executionResult,
        };
      }

      return {
        executionResult,
        currentNode: OBJECT_GRAPH_NODES.HANDLE_SUCCESS,
        isCompleted: true,
        messages: [
          ...state.messages,
          new SystemMessage(`Object execution completed: ${JSON.stringify(executionResult)}`),
        ],
      };
    } catch (error) {
      this.logger.error('Object execution failed', error);
      return {
        error: error instanceof Error ? error.message : 'Object execution failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async performExecution(state: ObjectStateType): Promise<ObjectExecutionResult> {
    try {
      const result: ObjectExecutionResult = {
        status: 'success',
        createdEntities: {},
      };

      // Determine the operation type and execute accordingly
      if (state.objectSpec && !state.dbDesignResult?.objectExists) {
        // Create new object
        const createResult = await this.createObject(state);
        Object.assign(result, createResult);
      } else if (state.typeMappingResult?.mappedFields && state.dbDesignResult?.objectId) {
        // Add fields to existing object
        const addFieldsResult = await this.addFieldsToObject(state);
        Object.assign(result, addFieldsResult);
      } else if (state.fieldSpec && state.dbDesignResult?.objectId) {
        // Add single field to existing object
        const addFieldResult = await this.addSingleField(state);
        Object.assign(result, addFieldResult);
      } else {
        result.status = 'failed';
        result.errors = ['No valid operation detected'];
      }

      return result;
    } catch (error) {
      this.logger.error('Error during object execution', error);
      return {
        status: 'failed',
        errors: [`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async createObject(state: ObjectStateType): Promise<Partial<ObjectExecutionResult>> {
    if (!state.objectSpec) {
      return {
        status: 'failed',
        errors: ['No object specification provided'],
      };
    }

    const createResult = await this.executeUpdateObject({
      action: 'create_object',
      objectName: state.objectSpec.objectName,
      fields: state.typeMappingResult?.mappedFields || [],
      description: state.objectSpec.description,
    });

    if (createResult.success) {
      return {
        status: 'success',
        objectId: createResult.objectId,
        fieldIds: createResult.fieldIds,
        createdEntities: {
          object: createResult.objectId || '',
          ...(createResult.fieldIds?.reduce(
            (acc: Record<string, string>, id: string, index: number) => {
              acc[`field_${index}`] = id;
              return acc;
            },
            {},
          ) || {}),
        },
      };
    } else {
      return {
        status: 'failed',
        errors: createResult.errors || ['Object creation failed'],
      };
    }
  }

  private async addFieldsToObject(state: ObjectStateType): Promise<Partial<ObjectExecutionResult>> {
    if (!state.dbDesignResult?.objectId || !state.typeMappingResult?.mappedFields) {
      return {
        status: 'failed',
        errors: ['Missing object ID or mapped fields'],
      };
    }

    const addResult = await this.executeUpdateObject({
      action: 'add_fields',
      objectId: state.dbDesignResult.objectId,
      fields: state.typeMappingResult.mappedFields,
    });

    if (addResult.success) {
      return {
        status: 'success',
        objectId: state.dbDesignResult.objectId,
        fieldIds: addResult.fieldIds,
        createdEntities: {
          ...(addResult.fieldIds?.reduce(
            (acc: Record<string, string>, id: string, index: number) => {
              acc[`field_${index}`] = id;
              return acc;
            },
            {},
          ) || {}),
        },
      };
    } else {
      return {
        status: 'failed',
        errors: addResult.errors || ['Failed to add fields'],
      };
    }
  }

  private async addSingleField(state: ObjectStateType): Promise<Partial<ObjectExecutionResult>> {
    if (
      !state.dbDesignResult?.objectId ||
      !state.fieldSpec ||
      !state.typeMappingResult?.mappedFields[0]
    ) {
      return {
        status: 'failed',
        errors: ['Missing object ID, field specification, or mapped field'],
      };
    }

    const addResult = await this.executeUpdateObject({
      action: 'add_fields',
      objectId: state.dbDesignResult.objectId,
      fields: [state.typeMappingResult.mappedFields[0]],
    });

    if (addResult.success) {
      return {
        status: 'success',
        objectId: state.dbDesignResult.objectId,
        fieldIds: addResult.fieldIds,
        createdEntities: {
          field: addResult.fieldIds?.[0] || '',
        },
      };
    } else {
      return {
        status: 'failed',
        errors: addResult.errors || ['Failed to add field'],
      };
    }
  }

  private async executeUpdateObject(input: {
    action: 'create_object' | 'add_fields';
    objectId?: string;
    objectName?: string;
    description?: string;
    fields: unknown[];
  }): Promise<UpdateObjectResult> {
    try {
      const llmWithTools = OPENAI_GPT_4_1.bindTools([updateObjectTool]);
      const messages = [
        new SystemMessage('Use the UpdateObjectTool to create or update objects.'),
        new HumanMessage(`Execute object operation: ${JSON.stringify(input)}`),
      ];

      await llmWithTools.invoke(messages);

      // Simulate the operation for now
      if (input.action === 'create_object') {
        const objectId = `obj_${input.objectName?.toLowerCase()}_${Date.now()}`;
        const fieldIds = input.fields.map((_, index) => `field_${Date.now()}_${index}`);

        return {
          success: true,
          objectId,
          fieldIds,
        };
      } else {
        const fieldIds = input.fields.map((_, index) => `field_${Date.now()}_${index}`);

        return {
          success: true,
          objectId: input.objectId,
          fieldIds,
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Update object operation failed'],
      };
    }
  }
}
