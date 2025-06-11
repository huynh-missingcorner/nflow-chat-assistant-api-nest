import { Injectable } from '@nestjs/common';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { CHAT_FILTER_PROMPTS } from '../constants/chat-filter-prompts';
import { GRAPH_NODES, LOG_MESSAGES } from '../constants/graph-constants';
import { ChatFilterOutput, ChatFilterTool } from '../tools/chat-filter.tool';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class ChatOrNflowFilterNode extends GraphNodeBase {
  async execute(state: CoordinatorStateType): Promise<Partial<CoordinatorStateType>> {
    try {
      this.logger.debug(LOG_MESSAGES.CLASSIFYING_INTENT(state.originalMessage));

      const messages = this.buildFilterMessages(state);
      const filterResult = await this.performFiltering(messages);

      if (!filterResult.isNflowOperation) {
        // It's casual chat - respond directly and mark as completed
        const chatResponse = filterResult.chatResponse || CHAT_FILTER_PROMPTS.DEFAULT_CHAT_RESPONSE;

        const responseMessage = new AIMessage({
          content: chatResponse,
          id: uuidv4(),
        });

        return this.createSuccessResult({
          messages: [responseMessage],
          isCompleted: true,
        });
      }

      // It's an nflow operation - continue to intent classification
      return this.createSuccessResult({
        messages: [new HumanMessage(state.originalMessage)],
      });
    } catch (error) {
      return this.handleError(error, 'chat filtering');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.CHAT_OR_NFLOW_FILTER;
  }

  private buildFilterMessages(state: CoordinatorStateType) {
    const systemPrompt = this.buildSystemPrompt(state);

    return [new SystemMessage(systemPrompt), new HumanMessage(state.originalMessage)];
  }

  private buildSystemPrompt(state: CoordinatorStateType): string {
    let prompt = CHAT_FILTER_PROMPTS.SYSTEM_PROMPT_BASE;

    // Add session context for better chat responses
    const sessionContext = this.buildSessionContext(state);
    if (sessionContext) {
      prompt += `\n\n## CURRENT SESSION CONTEXT:\n${sessionContext}`;
    }

    return prompt;
  }

  private buildSessionContext(state: CoordinatorStateType): string {
    const contextSections: string[] = [];

    // Add application results
    if (state.applicationResults && state.applicationResults.length > 0) {
      contextSections.push(`Applications created: ${state.applicationResults.length}`);
      contextSections.push(`Recent: ${JSON.stringify(state.applicationResults)}`);
    }

    // Add object results
    if (state.objectResults && state.objectResults.length > 0) {
      contextSections.push(`Objects created: ${state.objectResults.length}`);
      contextSections.push(`Recent: ${JSON.stringify(state.objectResults)}`);
    }

    return contextSections.length > 0 ? contextSections.join(', ') : '';
  }

  private async performFiltering(messages: any[]): Promise<ChatFilterOutput> {
    const llmWithTools = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([ChatFilterTool]);
    const response = await llmWithTools.invoke(messages);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      // Fallback: if no tool calls, assume it's casual chat
      return {
        isNflowOperation: false,
        chatResponse: CHAT_FILTER_PROMPTS.FALLBACK_CHAT_RESPONSE,
      };
    }

    const toolCall = response.tool_calls[0];
    return toolCall.args as ChatFilterOutput;
  }
}
