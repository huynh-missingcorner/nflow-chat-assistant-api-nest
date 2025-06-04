import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { fieldExistenceTool } from '../tools/field-existence.tool';
import { objectLookupTool } from '../tools/object-lookup.tool';
import { DBDesignResult, ObjectStateType } from '../types/object-graph-state.types';

type ObjectLookupResult = {
  exists: boolean;
  objectId?: string;
  error?: string;
};

type FieldExistenceResult = {
  exists: boolean;
  fieldId?: string;
  fieldType?: string;
  error?: string;
};

@Injectable()
export class DBDesignNode {
  private readonly logger = new Logger(DBDesignNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.DB_DESIGN_COMPLETED);

      const dbDesignResult = await this.performDBDesign(state);

      if (!dbDesignResult.valid) {
        return {
          error: `DB design validation failed: ${dbDesignResult.conflicts?.join(', ')}`,
          currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
          dbDesignResult,
        };
      }

      return {
        dbDesignResult,
        currentNode: OBJECT_GRAPH_NODES.TYPE_MAPPER,
        messages: [
          ...state.messages,
          new SystemMessage(`DB design completed: ${JSON.stringify(dbDesignResult)}`),
        ],
      };
    } catch (error) {
      this.logger.error('DB design failed', error);
      return {
        error: error instanceof Error ? error.message : 'DB design failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async performDBDesign(state: ObjectStateType): Promise<DBDesignResult> {
    const result: DBDesignResult = {
      valid: true,
      conflicts: [],
      recommendations: [],
    };

    try {
      // Check for object operations
      if (state.objectSpec) {
        const objectLookupResult = await this.lookupObject(state.objectSpec.objectName);

        if (objectLookupResult.error) {
          result.valid = false;
          result.conflicts?.push(`Object lookup failed: ${objectLookupResult.error}`);
          return result;
        }

        result.objectId = objectLookupResult.objectId;
        result.objectExists = objectLookupResult.exists;

        if (objectLookupResult.exists && objectLookupResult.objectId && state.objectSpec.fields) {
          // Check for field conflicts
          for (const field of state.objectSpec.fields) {
            const fieldExistsResult = await this.checkFieldExistence({
              objectId: objectLookupResult.objectId,
              fieldName: field.name,
            });

            if (fieldExistsResult.error) {
              result.valid = false;
              result.conflicts?.push(`Field existence check failed: ${fieldExistsResult.error}`);
              continue;
            }

            if (fieldExistsResult.exists) {
              result.conflicts?.push(
                `Field '${field.name}' already exists in object '${state.objectSpec.objectName}'`,
              );
              result.valid = false;
            }
          }
        }
      }

      // Check for single field operations
      if (state.fieldSpec && !state.objectSpec) {
        // Need to determine target object from context or prompt
        result.recommendations?.push('Object target needs to be specified for field operation');
      }

      // Add recommendations for best practices
      if (state.objectSpec?.fields) {
        const fieldNames = state.objectSpec.fields.map((f) => f.name);
        const duplicateFields = fieldNames.filter(
          (name, index) => fieldNames.indexOf(name) !== index,
        );

        if (duplicateFields.length > 0) {
          result.conflicts?.push(`Duplicate field names: ${duplicateFields.join(', ')}`);
          result.valid = false;
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Error during DB design analysis', error);
      return {
        valid: false,
        conflicts: [
          `DB design analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  private async lookupObject(objectName: string): Promise<ObjectLookupResult> {
    try {
      const llmWithTools = OPENAI_GPT_4_1.bindTools([objectLookupTool]);
      const messages = [
        new SystemMessage('Use the ObjectLookupTool to check if the object exists.'),
        new HumanMessage(`Look up object: ${objectName}`),
      ];

      const response = await llmWithTools.invoke(messages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        return { exists: false, error: 'No tool calls found in object lookup response' };
      }

      // Simulate the lookup for now
      const mockExists = ['user', 'customer', 'order', 'product', 'account'].includes(
        objectName.toLowerCase(),
      );

      return {
        exists: mockExists,
        objectId: mockExists ? `obj_${objectName.toLowerCase()}_123` : undefined,
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Object lookup failed',
      };
    }
  }

  private async checkFieldExistence(input: {
    objectId: string;
    fieldName: string;
  }): Promise<FieldExistenceResult> {
    try {
      const llmWithTools = OPENAI_GPT_4_1.bindTools([fieldExistenceTool]);
      const messages = [
        new SystemMessage('Use the FieldExistenceTool to check if the field exists in the object.'),
        new HumanMessage(
          `Check if field "${input.fieldName}" exists in object "${input.objectId}"`,
        ),
      ];

      const response = await llmWithTools.invoke(messages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        return { exists: false, error: 'No tool calls found in field existence check response' };
      }

      // Simulate field existence check for now
      const mockFieldExists = false; // Default to field not existing

      return {
        exists: mockFieldExists,
        fieldId: mockFieldExists ? `field_${input.fieldName}_001` : undefined,
        fieldType: mockFieldExists ? 'Text' : undefined,
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Field existence check failed',
      };
    }
  }
}
