import { Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import {
  buildFieldOperationPrompt,
  buildParsingPrompt,
  FIELD_OPERATION_SYSTEM_PROMPT,
  TYPE_MAPPER_SYSTEM_PROMPT,
} from '../prompts/type-mapping.prompts';
import { ChangeFieldInput, changeFieldTool } from '../tools/fields/change-field.tool';
import { ApiFormatParserInput, apiFormatParserTool } from '../tools/others/api-format-parser.tool';
import { NflowSchemaDesignInput } from '../tools/others/nflow-schema-design.tool';
import { ObjectField, ObjectStateType, TypeMappingResult } from '../types/object-graph-state.types';
import { ObjectGraphNodeBase } from './object-graph-node.base';

@Injectable()
export class TypeMapperNode extends ObjectGraphNodeBase {
  protected getNodeName(): string {
    return OBJECT_GRAPH_NODES.TYPE_MAPPER;
  }

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.TYPE_MAPPING_COMPLETED);

      // Determine if this is a field-only operation
      const isFieldOnlyOperation = state.fieldSpec?.objectName && !state.dbDesignResult;

      if (isFieldOnlyOperation) {
        const { typeMappingResult, newMessages } = await this.parseFieldOperation(state);

        if (!typeMappingResult || typeMappingResult.errors?.length) {
          return {
            error: `Field operation parsing failed: ${typeMappingResult?.errors?.join(', ') || 'Unknown error'}`,
            currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
            typeMappingResult,
            messages: newMessages,
          };
        }

        return {
          typeMappingResult,
          messages: newMessages,
        };
      } else {
        // Standard API format parsing for object creation with fields
        const { typeMappingResult, newMessages } = await this.parseApiFormat(state);

        if (!typeMappingResult || typeMappingResult.errors?.length) {
          return {
            error: `API format parsing failed: ${typeMappingResult?.errors?.join(', ') || 'Unknown error'}`,
            currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
            typeMappingResult,
            messages: newMessages,
          };
        }

        return {
          typeMappingResult,
          messages: newMessages,
        };
      }
    } catch (error) {
      this.logger.error('Type mapping failed', error);
      return {
        error: error instanceof Error ? error.message : 'Type mapping failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async parseApiFormat(state: ObjectStateType): Promise<{
    typeMappingResult: TypeMappingResult | undefined;
    newMessages: BaseMessage[];
  }> {
    try {
      // Try to extract from DB design result first (for full object creation)
      let nflowSchema: NflowSchemaDesignInput | null = this.extractNflowSchema(state);

      // If no schema from DB design, try to build from field spec (for field-only operations)
      if (!nflowSchema && state.fieldSpec) {
        nflowSchema = this.buildSchemaFromFieldSpec(state);
      }

      if (!nflowSchema) {
        return {
          typeMappingResult: this.createFailedResult([
            'No schema found - neither from DB design nor field spec',
          ]),
          newMessages: [],
        };
      }

      const { apiFormat, newMessages } = await this.performApiParsing(nflowSchema, state);

      if (!apiFormat) {
        return {
          typeMappingResult: this.createFailedResult(['Failed to parse schema into API format']),
          newMessages,
        };
      }

      return {
        typeMappingResult: this.createParsingResult(apiFormat),
        newMessages,
      };
    } catch (error) {
      this.logger.error('Error during API format parsing', error);
      return {
        typeMappingResult: this.createFailedResult([
          `API parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ]),
        newMessages: [],
      };
    }
  }

  private extractNflowSchema(state: ObjectStateType): NflowSchemaDesignInput | null {
    const dbDesignResult = state.dbDesignResult;

    if (!dbDesignResult?.nflowSchema) {
      this.logger.warn('No Nflow schema found in design result');
      return null;
    }

    return dbDesignResult.nflowSchema as NflowSchemaDesignInput;
  }

  private async performApiParsing(
    nflowSchema: NflowSchemaDesignInput,
    state: ObjectStateType,
  ): Promise<{
    apiFormat: ApiFormatParserInput | undefined;
    newMessages: BaseMessage[];
  }> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([apiFormatParserTool]);

      const objectMappings = this.buildObjectMappings(state);
      const parsingPrompt = buildParsingPrompt(
        nflowSchema,
        objectMappings,
        state.createdObjects,
        state.objectSpec || undefined,
        state.fieldSpec || undefined,
        state.intent || undefined,
      );

      const messages = [
        new SystemMessage(TYPE_MAPPER_SYSTEM_PROMPT),
        new HumanMessage(parsingPrompt),
      ];

      const response = await llm.invoke(messages);
      const responseMessage = new AIMessage({
        content: response.content,
        id: response.id,
        tool_calls: response.tool_calls,
      });

      const newMessages = [...messages, responseMessage];

      if (!response.tool_calls || response.tool_calls.length === 0) {
        this.logger.error('No tool calls found in API parsing response');
        return { apiFormat: undefined, newMessages };
      }

      const toolCall = response.tool_calls[0];
      const parsingResult = toolCall.args as ApiFormatParserInput;

      this.logger.debug(`API format parsing result: ${JSON.stringify(parsingResult, null, 2)}`);
      return { apiFormat: parsingResult, newMessages };
    } catch (error) {
      this.logger.error('Error performing API parsing', error);
      return { apiFormat: undefined, newMessages: [] };
    }
  }

  /**
   * Builds object name mappings from state
   */
  private buildObjectMappings(state: ObjectStateType): Map<string, string> {
    const allObjectMappings = new Map<string, string>();

    // Add mappings from state.objectNameMapping (schema-level mappings)
    if (state.objectNameMapping) {
      for (const [originalName, uniqueName] of Object.entries(state.objectNameMapping)) {
        allObjectMappings.set(originalName, uniqueName);
      }
    }

    // Add mappings from created objects in current thread (thread-level mappings)
    if (state.createdObjects && state.createdObjects.length > 0) {
      for (const obj of state.createdObjects) {
        allObjectMappings.set(obj.originalName, obj.uniqueName);
      }
    }

    return allObjectMappings;
  }

  private createParsingResult(apiFormat: ApiFormatParserInput): TypeMappingResult {
    // Convert API format to internal ObjectField format for compatibility
    const mappedFields: ObjectField[] = apiFormat.fieldsFormat.map((field) => ({
      name: field.data.name,
      type: field.data.typeName,
      required: true, // Will be determined during execution
      defaultValue: undefined,
      options: undefined,
      validationRules: [],
    }));

    return {
      mappedFields,
      warnings: apiFormat.parsingNotes || [],
      errors: [],
      apiFormat, // Store the parsed API format for execution
    };
  }

  private createFailedResult(errors: string[]): TypeMappingResult {
    return {
      mappedFields: [],
      errors,
      warnings: [],
    };
  }

  /**
   * Build a minimal schema from field spec for field-only operations
   */
  private buildSchemaFromFieldSpec(state: ObjectStateType): NflowSchemaDesignInput | null {
    if (!state.fieldSpec || !state.fieldSpec.objectName) {
      return null;
    }

    // Create a minimal schema for field-only operations
    // Let the LLM determine the correct NFlow type through the API parsing tools
    const schema: NflowSchemaDesignInput = {
      objectName: state.fieldSpec.objectName, // This should be the unique name from mapping
      displayName: state.fieldSpec.objectName,
      description: 'Existing object for field manipulation',
      fields: [
        {
          name: state.fieldSpec.name,
          displayName: state.fieldSpec.name,
          typeName: 'text', // Default type - let the API parser tool determine the correct type
          required: state.fieldSpec.required || false,
          description: state.fieldSpec.description || undefined,
          defaultValue: state.fieldSpec.defaultValue
            ? JSON.stringify(state.fieldSpec.defaultValue)
            : undefined,
        },
      ],
      designNotes: [
        'Field-only operation - existing object',
        `Original type hint from user: ${state.fieldSpec.typeHint}`,
        `Field action: ${state.fieldSpec.action || 'create'}`,
      ],
    };

    return schema;
  }

  /**
   * Parse field-only operations using the dedicated field operation tool
   */
  private async parseFieldOperation(state: ObjectStateType): Promise<{
    typeMappingResult: TypeMappingResult | undefined;
    newMessages: BaseMessage[];
  }> {
    try {
      if (!state.fieldSpec) {
        return {
          typeMappingResult: this.createFailedResult(['No field specification found']),
          newMessages: [],
        };
      }

      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([changeFieldTool]);

      const objectMappings = this.buildObjectMappings(state);
      const fieldPrompt = buildFieldOperationPrompt(
        state.fieldSpec,
        objectMappings,
        state.createdObjects,
      );

      const messages = [
        new SystemMessage(FIELD_OPERATION_SYSTEM_PROMPT),
        new HumanMessage(fieldPrompt),
      ];

      const response = await llm.invoke(messages);
      const responseMessage = new AIMessage({
        content: response.content,
        id: response.id,
        tool_calls: response.tool_calls,
      });

      const newMessages = [...messages, responseMessage];

      if (!response.tool_calls || response.tool_calls.length === 0) {
        this.logger.error('No tool calls found in field operation response');
        return {
          typeMappingResult: this.createFailedResult(['No field operation result']),
          newMessages,
        };
      }

      const toolCall = response.tool_calls[0];
      const fieldOperation = toolCall.args as ChangeFieldInput;

      // Convert field operation to API format
      const apiFormat = this.convertFieldOperationToApiFormat(fieldOperation);

      return {
        typeMappingResult: this.createParsingResult(apiFormat),
        newMessages,
      };
    } catch (error) {
      this.logger.error('Error during field operation parsing', error);
      return {
        typeMappingResult: this.createFailedResult([
          `Field operation parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ]),
        newMessages: [],
      };
    }
  }

  /**
   * Convert field operation to API format
   */
  private convertFieldOperationToApiFormat(fieldOperation: ChangeFieldInput): ApiFormatParserInput {
    return {
      objectFormat: {
        data: {
          displayName: 'Existing Object',
          recordName: { label: 'Existing Object', type: 'text' },
          owd: 'Private',
          name: fieldOperation.objName,
          description: 'Existing object for field operation',
        },
        action: 'update',
        name: fieldOperation.objName,
      },
      fieldsFormat: [
        {
          objName: fieldOperation.objName,
          data: fieldOperation.data as ApiFormatParserInput['fieldsFormat'][0]['data'],
          action: fieldOperation.action,
        },
      ],
      parsingNotes: ['Field-only operation on existing object'],
    };
  }
}
