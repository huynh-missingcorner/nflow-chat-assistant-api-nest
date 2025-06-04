import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { typeMappingTool } from '../tools/type-mapping.tool';
import { ObjectField, ObjectStateType, TypeMappingResult } from '../types/object-graph-state.types';

@Injectable()
export class TypeMapperNode {
  private readonly logger = new Logger(TypeMapperNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.TYPE_MAPPING_COMPLETED);

      const typeMappingResult = await this.performTypeMapping(state);

      if (typeMappingResult.errors && typeMappingResult.errors.length > 0) {
        return {
          error: `Type mapping failed: ${typeMappingResult.errors.join(', ')}`,
          currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
          typeMappingResult,
        };
      }

      return {
        typeMappingResult,
        currentNode: OBJECT_GRAPH_NODES.OBJECT_EXECUTOR,
        messages: [
          ...state.messages,
          new SystemMessage(`Type mapping completed: ${JSON.stringify(typeMappingResult)}`),
        ],
      };
    } catch (error) {
      this.logger.error('Type mapping failed', error);
      return {
        error: error instanceof Error ? error.message : 'Type mapping failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async performTypeMapping(state: ObjectStateType): Promise<TypeMappingResult> {
    const result: TypeMappingResult = {
      mappedFields: [],
      errors: [],
      warnings: [],
    };

    try {
      const fieldsToMap: Array<{
        name: string;
        typeHint: string;
        required?: boolean;
        defaultValue?: unknown;
      }> = [];

      // Collect fields from objectSpec
      if (state.objectSpec?.fields) {
        fieldsToMap.push(
          ...state.objectSpec.fields.map((f) => ({
            name: f.name,
            typeHint: f.typeHint,
            required: f.required,
            defaultValue: f.defaultValue,
          })),
        );
      }

      // Collect field from fieldSpec
      if (state.fieldSpec) {
        fieldsToMap.push({
          name: state.fieldSpec.name,
          typeHint: state.fieldSpec.typeHint,
          required: state.fieldSpec.required,
          defaultValue: state.fieldSpec.defaultValue,
        });
      }

      // Map each field type
      for (const field of fieldsToMap) {
        try {
          const mappedField = await this.mapFieldType({
            fieldName: field.name,
            typeHint: field.typeHint,
            required: field.required || false,
            defaultValue: field.defaultValue,
          });

          result.mappedFields.push(mappedField);
        } catch (fieldError) {
          result.errors?.push(
            `Error mapping field '${field.name}': ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`,
          );
        }
      }

      // Validate mapping results
      if (result.mappedFields.length === 0 && fieldsToMap.length > 0) {
        result.errors?.push('No fields were successfully mapped');
      }

      return result;
    } catch (error) {
      this.logger.error('Error during type mapping', error);
      return {
        mappedFields: [],
        errors: [
          `Type mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  private async mapFieldType(input: {
    fieldName: string;
    typeHint: string;
    required: boolean;
    defaultValue?: unknown;
  }): Promise<ObjectField> {
    try {
      const llmWithTools = OPENAI_GPT_4_1.bindTools([typeMappingTool]);
      const messages = [
        new SystemMessage('Use the TypeMappingTool to map the field type.'),
        new HumanMessage(`Map field type: ${JSON.stringify(input)}`),
      ];

      await llmWithTools.invoke(messages);

      // Simulate type mapping for now
      const typeMap: Record<string, string> = {
        text: 'Text',
        string: 'Text',
        number: 'Numeric',
        numeric: 'Numeric',
        boolean: 'Checkbox',
        date: 'Date Time',
        picklist: 'Pick List',
        enum: 'Pick List',
      };

      const mappedType = typeMap[input.typeHint.toLowerCase()] || 'Text';

      return {
        name: input.fieldName,
        type: mappedType,
        required: input.required,
        defaultValue: input.defaultValue,
      };
    } catch (error) {
      throw new Error(
        `Failed to map field type: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
