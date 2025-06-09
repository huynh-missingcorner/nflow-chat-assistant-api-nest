import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { ApiFormatParserInput, apiFormatParserTool } from '../tools/api-format-parser.tool';
import { NflowSchemaDesignInput } from '../tools/nflow-schema-design.tool';
import { ObjectField, ObjectStateType, TypeMappingResult } from '../types/object-graph-state.types';

@Injectable()
export class TypeMapperNode {
  private readonly logger = new Logger(TypeMapperNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.TYPE_MAPPING_COMPLETED);

      const typeMappingResult = await this.parseApiFormat(state);

      if (!typeMappingResult || typeMappingResult.errors?.length) {
        return this.createErrorResult(
          typeMappingResult?.errors?.join(', ') || 'API format parsing failed',
          typeMappingResult,
        );
      }

      return this.createSuccessResult(typeMappingResult, state);
    } catch (error) {
      this.logger.error('API format parsing failed', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'API format parsing failed',
      );
    }
  }

  private async parseApiFormat(state: ObjectStateType): Promise<TypeMappingResult | undefined> {
    try {
      const nflowSchema: NflowSchemaDesignInput | null = this.extractNflowSchema(state);

      if (!nflowSchema) {
        return this.createFailedResult(['No Nflow schema found in design result']);
      }

      const apiFormat = await this.performApiParsing(nflowSchema, state);

      if (!apiFormat) {
        return this.createFailedResult(['Failed to parse schema into API format']);
      }

      return this.createParsingResult(apiFormat);
    } catch (error) {
      this.logger.error('Error during API format parsing', error);
      return this.createFailedResult([
        `API parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
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
  ): Promise<ApiFormatParserInput | undefined> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([apiFormatParserTool]);

      const parsingPrompt = this.buildParsingPrompt(nflowSchema, state);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.TYPE_PARSER_SYSTEM_PROMPT),
        new HumanMessage(parsingPrompt),
      ];

      const response = await llm.invoke(messages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        this.logger.error('No tool calls found in API parsing response');
        return undefined;
      }

      const toolCall = response.tool_calls[0];
      const parsingResult = toolCall.args as ApiFormatParserInput;

      this.logger.debug(`API format parsing result: ${JSON.stringify(parsingResult, null, 2)}`);
      return parsingResult;
    } catch (error) {
      this.logger.error('Error performing API parsing', error);
      return undefined;
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

  private createErrorResult(
    errorMessage: string,
    typeMappingResult?: TypeMappingResult,
  ): Partial<ObjectStateType> {
    return {
      error: `API format parsing failed: ${errorMessage}`,
      currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      typeMappingResult,
    };
  }

  private createSuccessResult(
    typeMappingResult: TypeMappingResult,
    state: ObjectStateType,
  ): Partial<ObjectStateType> {
    return {
      typeMappingResult,
      currentNode: OBJECT_GRAPH_NODES.OBJECT_EXECUTOR,
      messages: [
        ...state.messages,
        new SystemMessage(`API format parsing completed: ${JSON.stringify(typeMappingResult)}`),
      ],
    };
  }
}
