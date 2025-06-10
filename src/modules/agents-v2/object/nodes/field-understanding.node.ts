import { Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { SYSTEM_PROMPTS } from '../constants/system-prompts';
import { fieldExtractionTool } from '../tools/field-extraction.tool';
import { FieldSpec, ObjectStateType } from '../types/object-graph-state.types';
import { ObjectGraphNodeBase } from './object-graph-node.base';

@Injectable()
export class FieldUnderstandingNode extends ObjectGraphNodeBase {
  protected getNodeName(): string {
    return OBJECT_GRAPH_NODES.FIELD_UNDERSTANDING;
  }

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.FIELD_UNDERSTANDING_COMPLETED);

      const { fieldSpec, newMessages } = await this.extractFieldSpecification(
        state.originalMessage,
      );

      if (!fieldSpec) {
        return {
          error: 'Failed to extract field specification',
          currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
          messages: newMessages,
        };
      }

      return {
        fieldSpec,
        currentNode: OBJECT_GRAPH_NODES.DB_DESIGN,
        messages: newMessages,
      };
    } catch (error) {
      this.logger.error('Field understanding failed', error);
      return {
        error: error instanceof Error ? error.message : 'Field understanding failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async extractFieldSpecification(message: string): Promise<{
    fieldSpec: FieldSpec | null;
    newMessages: BaseMessage[];
  }> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([fieldExtractionTool]);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.FIELD_EXTRACTION_SYSTEM_PROMPT),
        new HumanMessage(message),
      ];

      const response = await llm.invoke(messages);
      const responseMessage = new AIMessage({
        content: response.content,
        id: response.id,
        tool_calls: response.tool_calls,
      });

      const newMessages = [...messages, responseMessage];

      const toolCalls = response.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        this.logger.error('No tool calls found in field extraction response');
        return { fieldSpec: null, newMessages };
      }

      const toolCall = toolCalls[0];
      return { fieldSpec: toolCall.args as FieldSpec, newMessages };
    } catch (error) {
      this.logger.error('Error extracting field specification', error);
      return { fieldSpec: null, newMessages: [] };
    }
  }
}
