import { Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { ApiFormatParserInput, apiFormatParserTool } from '../tools/api-format-parser.tool';
import { ChangeFieldInput, changeFieldTool } from '../tools/change-field.tool';
import { NflowSchemaDesignInput } from '../tools/nflow-schema-design.tool';
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

      const parsingPrompt = this.buildParsingPrompt(nflowSchema, state);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.TYPE_PARSER_SYSTEM_PROMPT),
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

  private buildParsingPrompt(nflowSchema: NflowSchemaDesignInput, state: ObjectStateType): string {
    let prompt =
      'Parse the following Nflow schema into exact API format for changeObject and changeField tools:\n\n';

    // Add Nflow schema information
    prompt += `Nflow Schema: ${JSON.stringify(nflowSchema, null, 2)}\n\n`;

    // Add object name mapping context for relation fields
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

    // Add object mapping context if available
    if (allObjectMappings.size > 0) {
      prompt += `Available Object Name Mappings:\n`;
      for (const [originalName, uniqueName] of allObjectMappings) {
        // Try to find display name from created objects
        const createdObj = state.createdObjects?.find((obj) => obj.originalName === originalName);
        const displayName = createdObj?.displayName || originalName;

        if (displayName !== originalName) {
          prompt += `- "${displayName}" / "${originalName}" → Unique Name: "${uniqueName}"\n`;
        } else {
          prompt += `- "${originalName}" → Unique Name: "${uniqueName}"\n`;
        }
      }
      prompt += '\n';
    }

    // Add context from original requirements
    if (state.objectSpec) {
      prompt += `Original Requirements:\n`;
      prompt += `- Object Name: ${state.objectSpec.objectName}\n`;

      if (state.objectSpec.description) {
        prompt += `- Description: ${state.objectSpec.description}\n`;
      }

      if (state.objectSpec.fields) {
        prompt += `- Original Fields:\n`;
        for (const field of state.objectSpec.fields) {
          prompt += `  * ${field.name} (${field.typeHint})${field.required ? ' - REQUIRED' : ''}\n`;
        }
      }
    }

    // Add field spec context for field-only operations
    if (state.fieldSpec) {
      prompt += `Field Specification:\n`;
      prompt += `- Field Name: ${state.fieldSpec.name}\n`;
      prompt += `- Type Hint: ${state.fieldSpec.typeHint}\n`;
      prompt += `- Required: ${state.fieldSpec.required || false}\n`;
      prompt += `- Action: ${state.fieldSpec.action || 'create'}\n`;
      prompt += `- Target Object: ${state.fieldSpec.objectName}\n`;
      if (state.fieldSpec.description) {
        prompt += `- Description: ${state.fieldSpec.description}\n`;
      }
      if (state.fieldSpec.defaultValue) {
        prompt += `- Default Value: ${JSON.stringify(state.fieldSpec.defaultValue)}\n`;
      }
    }

    // Add intent context
    if (state.intent) {
      prompt += `\nOperation: ${state.intent.intent}\n`;
      if (state.intent.details) {
        prompt += `Details: ${JSON.stringify(state.intent.details)}\n`;
      }
    }

    prompt += `\nIMPORTANT INSTRUCTIONS:
1. Convert the type hint "${state.fieldSpec?.typeHint || 'text'}" to the appropriate NFlow typeName
2. Set the correct subType based on the field requirements
3. Use the action "${state.fieldSpec?.action || 'create'}" for the field operation
4. Ensure the objName in fieldsFormat matches the target object name exactly
5. For relation fields, use the UNIQUE OBJECT NAME from the mapping above for the 'value' field
6. Parse this into the exact API format required by changeObjectTool and changeFieldTool

Type Conversion Guidelines:
- text/string → typeName: "text", subType: "short"/"long"/"rich" based on length
- number/numeric → typeName: "numeric", subType: "integer"/"float" based on precision
- boolean → typeName: "boolean"
- date/datetime → typeName: "dateTime", subType: "date"/"time"/"date-time"
- json → typeName: "json"
- picklist → typeName: "pickList", subType: "single"/"multiple"
- file → typeName: "file"
- relation → typeName: "relation" (IMPORTANT: set 'value' to the unique target object name from mapping)

CRITICAL FOR RELATION FIELDS:
- When typeName is "relation", the 'value' field MUST contain the unique target object name
- Look up the target object name in the mapping above and use the unique name
- If the field has targetObject property, use that as the value for the relation field
- Example: if user mentions "User" and mapping shows "User" → "user_1234567890", use "user_1234567890" in the value field
- For auto-generated relation fields, use the targetObject property as the value`;

    return prompt;
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

      const fieldPrompt = this.buildFieldOperationPrompt(state);

      const messages = [
        new SystemMessage(this.getFieldOperationSystemPrompt()),
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

  /**
   * Build prompt for field operation
   */
  private buildFieldOperationPrompt(state: ObjectStateType): string {
    const fieldSpec = state.fieldSpec!;

    let prompt = `Convert this field specification into a proper field operation:\n\n`;

    // Add object name mapping context for relation fields
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

    // Add object mapping context if available
    if (allObjectMappings.size > 0) {
      prompt += `Available Object Name Mappings:\n`;
      for (const [originalName, uniqueName] of allObjectMappings) {
        // Try to find display name from created objects
        const createdObj = state.createdObjects?.find((obj) => obj.originalName === originalName);
        const displayName = createdObj?.displayName || originalName;

        if (displayName !== originalName) {
          prompt += `- "${displayName}" / "${originalName}" → Unique Name: "${uniqueName}"\n`;
        } else {
          prompt += `- "${originalName}" → Unique Name: "${uniqueName}"\n`;
        }
      }
      prompt += '\n';
    }

    prompt += `Field Specification:
- Field Name: ${fieldSpec.name}
- Type Hint: ${fieldSpec.typeHint}
- Required: ${fieldSpec.required || false}
- Action: ${fieldSpec.action || 'create'}
- Target Object: ${fieldSpec.objectName}
- Description: ${fieldSpec.description || 'No description provided'}
- Default Value: ${fieldSpec.defaultValue ? JSON.stringify(fieldSpec.defaultValue) : 'None'}

Requirements:
1. Convert the type hint "${fieldSpec.typeHint}" to the correct NFlow typeName and subType
2. Use action "${fieldSpec.action || 'create'}"
3. Set objName to "${fieldSpec.objectName}" (use unique name from mapping if available)
4. For relation fields, set the 'value' field to the unique target object name from the mapping above
5. Ensure all required attributes are properly configured
6. Handle special type requirements (relations, pickLists, etc.)

CRITICAL FOR RELATION FIELDS:
- When typeHint is "relation", the 'value' field MUST contain the unique target object name
- Look up the target object name in the mapping above and use the unique name
- If no mapping exists, use the original name but log a warning

Convert this specification using the FieldOperationTool.`;

    return prompt;
  }

  /**
   * Get system prompt for field operations
   */
  private getFieldOperationSystemPrompt(): string {
    return `You are an expert in NFlow field operations. Convert field specifications into proper field operations.

Key Guidelines:
1. **Type Mapping**: Convert user type hints to correct NFlow types:
   - text/string → "text" with subType "short"/"long"/"rich"
   - number/numeric → "numeric" with subType "integer"/"float"
   - boolean → "boolean"
   - date/datetime → "dateTime" with subType "date"/"time"/"date-time"
   - json → "json"
   - picklist → "pickList" with subType "single"/"multiple"
   - file → "file"
   - relation → "relation" with proper onDelete and filters

2. **Actions**: Support create, update, delete, recover operations
3. **Attributes**: Set proper subType and additional attributes based on field type
4. **Validation**: Ensure all required fields are present and correctly formatted

Use the FieldOperationTool to generate the field operation specification.`;
  }
}
