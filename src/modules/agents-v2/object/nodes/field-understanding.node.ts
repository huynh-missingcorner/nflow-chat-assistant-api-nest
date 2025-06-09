import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { fieldExtractionTool } from '../tools/field-extraction.tool';
import { FieldSpec, ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class FieldUnderstandingNode {
  private readonly logger = new Logger(FieldUnderstandingNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.FIELD_UNDERSTANDING_COMPLETED);

      const fieldSpec = await this.extractFieldSpec(state.originalMessage);

      if (!fieldSpec) {
        return {
          error: 'Failed to extract field specification',
          currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        };
      }

      return {
        fieldSpec,
        currentNode: OBJECT_GRAPH_NODES.DB_DESIGN,
        messages: [
          ...state.messages,
          new SystemMessage(`Field understanding completed: ${JSON.stringify(fieldSpec)}`),
        ],
      };
    } catch (error) {
      this.logger.error('Field understanding failed', error);
      return {
        error: error instanceof Error ? error.message : 'Field understanding failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async extractFieldSpec(message: string): Promise<FieldSpec | null> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([fieldExtractionTool]);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.FIELD_EXTRACTION_SYSTEM_PROMPT),
        new HumanMessage(message),
      ];

      const response = await llm.invoke(messages);

      const toolCalls = response.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        this.logger.error('No tool calls found in field extraction response');
        return null;
      }

      const toolCall = toolCalls[0];
      return toolCall.args as FieldSpec;
    } catch (error) {
      this.logger.error('Error extracting field specification', error);
      return null;
    }
  }
}
