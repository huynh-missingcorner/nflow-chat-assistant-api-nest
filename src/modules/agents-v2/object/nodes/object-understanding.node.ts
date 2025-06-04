import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { OBJECT_GRAPH_NODES, OBJECT_LOG_MESSAGES } from '../constants/object-graph.constants';
import { ObjectPrompts } from '../constants/prompts';
import { objectExtractionTool } from '../tools/object-extraction.tool';
import { ObjectSpec, ObjectStateType } from '../types/object-graph-state.types';

@Injectable()
export class ObjectUnderstandingNode {
  private readonly logger = new Logger(ObjectUnderstandingNode.name);

  async execute(state: ObjectStateType): Promise<Partial<ObjectStateType>> {
    try {
      this.logger.log(OBJECT_LOG_MESSAGES.OBJECT_UNDERSTANDING_COMPLETED);

      const objectSpec = await this.extractObjectSpec(state.originalMessage);

      if (!objectSpec) {
        return {
          error: 'Failed to extract object specification',
          currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
        };
      }

      return {
        objectSpec,
        currentNode: OBJECT_GRAPH_NODES.DB_DESIGN,
        messages: [
          ...state.messages,
          new SystemMessage(`Object understanding completed: ${JSON.stringify(objectSpec)}`),
        ],
      };
    } catch (error) {
      this.logger.error('Object understanding failed', error);
      return {
        error: error instanceof Error ? error.message : 'Object understanding failed',
        currentNode: OBJECT_GRAPH_NODES.HANDLE_ERROR,
      };
    }
  }

  private async extractObjectSpec(message: string): Promise<ObjectSpec | null> {
    try {
      const llm = OPENAI_GPT_4_1.bindTools([objectExtractionTool]);

      const messages = [
        new SystemMessage(ObjectPrompts.OBJECT_EXTRACTION_PROMPT),
        new HumanMessage(message),
      ];

      const response = await llm.invoke(messages);

      const toolCalls = response.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        this.logger.error('No tool calls found in object extraction response');
        return null;
      }

      const toolCall = toolCalls[0];
      return toolCall.args as ObjectSpec;
    } catch (error) {
      this.logger.error('Error extracting object specification', error);
      return null;
    }
  }
}
