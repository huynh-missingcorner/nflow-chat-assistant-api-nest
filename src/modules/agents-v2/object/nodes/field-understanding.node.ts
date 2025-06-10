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
        state,
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
        currentNode: OBJECT_GRAPH_NODES.TYPE_MAPPER, // Route directly to TYPE_MAPPER
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

  private async extractFieldSpecification(
    message: string,
    state: ObjectStateType,
  ): Promise<{
    fieldSpec: FieldSpec | null;
    newMessages: BaseMessage[];
  }> {
    try {
      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([fieldExtractionTool]);

      const contextualPrompt = this.buildContextualPrompt(message, state);

      const messages = [
        new SystemMessage(SYSTEM_PROMPTS.FIELD_EXTRACTION_SYSTEM_PROMPT),
        new HumanMessage(contextualPrompt),
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

  /**
   * Build a contextual prompt that includes information about created objects in the current thread
   */
  private buildContextualPrompt(message: string, state: ObjectStateType): string {
    let prompt = `User Request: ${message}\n\n`;

    // Add intent context
    if (state.intent) {
      prompt += `Intent: ${state.intent.intent}\n`;
      if (state.intent.details) {
        prompt += `Intent Details: ${JSON.stringify(state.intent.details)}\n`;
      }
      if (state.intent.target) {
        prompt += `Intent Target: ${Array.isArray(state.intent.target) ? state.intent.target.join(', ') : state.intent.target}\n`;
      }
      prompt += '\n';
    }

    // Add created objects context with name mapping
    if (state.createdObjects && state.createdObjects.length > 0) {
      prompt += `Created Objects in Current Thread:\n`;
      for (const obj of state.createdObjects) {
        prompt += `- Display Name: "${obj.displayName}" → Unique Name: "${obj.uniqueName}" (created in intent ${obj.intentIndex})`;
        if (obj.description) {
          prompt += ` - ${obj.description}`;
        }
        if (obj.fields && obj.fields.length > 0) {
          prompt += `\n  Fields: ${obj.fields.map((f) => f.displayName).join(', ')}`;
        }
        prompt += '\n';
      }
      prompt += '\n';

      // Add explicit mapping instructions
      prompt += `Object Name Mapping Instructions:
When the user refers to an object by its display name (e.g., "User", "E commerce User"), you MUST use the corresponding unique name for the objectName field.
From the mapping above:
`;
      for (const obj of state.createdObjects) {
        prompt += `- If user says "${obj.displayName}" → use objectName: "${obj.uniqueName}"\n`;
      }
      prompt += '\n';
    }

    prompt += `Based on the user request and context above, extract the field specification including:
1. Field name and type
2. Whether it's required
3. Action to perform (create, update, delete, recover)
4. Target object unique name (use the exact unique name from the mapping above)

IMPORTANT: When specifying objectName, use the unique name (e.g., "user_1231231234") NOT the display name (e.g., "User").`;

    return prompt;
  }
}
