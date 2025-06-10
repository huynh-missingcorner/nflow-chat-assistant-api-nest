import { Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { ApiFormatParserInput, apiFormatParserTool } from '../tools/api-format-parser.tool';
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
        currentNode: OBJECT_GRAPH_NODES.OBJECT_EXECUTOR,
        messages: newMessages,
      };
    } catch (error) {
      this.logger.error('API format parsing failed', error);
      return {
        error: error instanceof Error ? error.message : 'API format parsing failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async parseApiFormat(state: ObjectStateType): Promise<{
    typeMappingResult: TypeMappingResult | undefined;
    newMessages: BaseMessage[];
  }> {
    try {
      const nflowSchema: NflowSchemaDesignInput | null = this.extractNflowSchema(state);

      if (!nflowSchema) {
        return {
          typeMappingResult: this.createFailedResult(['No Nflow schema found in design result']),
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

    // Add intent context
    if (state.intent) {
      prompt += `\nOperation: ${state.intent.intent}\n`;
      if (state.intent.details) {
        prompt += `Details: ${JSON.stringify(state.intent.details)}\n`;
      }
    }

    prompt += `\nParse this into the exact API format required by changeObjectTool and changeFieldTool. Ensure all type names, subtypes, and attributes are correctly formatted for the Nflow API.`;

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
}
