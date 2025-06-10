import { Injectable } from '@nestjs/common';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import {
  APPLICATION_ERROR_MESSAGES,
  APPLICATION_GRAPH_NODES,
  APPLICATION_LOG_MESSAGES,
} from '../constants/application-graph.constants';
import {
  APP_UNDERSTANDING_SYSTEM_PROMPT,
  formatAppUnderstandingPrompt,
} from '../context/app-understanding.context';
import { AppUnderstandingInput, appUnderstandingTool } from '../tools/app-understanding.tool';
import { ApplicationSpec, ApplicationStateType } from '../types/application-graph-state.types';
import { ApplicationGraphNodeBase } from './application-graph-node.base';

@Injectable()
export class AppUnderstandingNode extends ApplicationGraphNodeBase {
  protected getNodeName(): string {
    return APPLICATION_GRAPH_NODES.APP_UNDERSTANDING;
  }

  async execute(state: ApplicationStateType): Promise<Partial<ApplicationStateType>> {
    try {
      this.logger.log('Starting application understanding analysis');
      this.logger.debug(
        `Input state: originalMessage="${state.originalMessage}", operationType="${state.operationType}"`,
      );

      const llm = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([appUnderstandingTool]);

      const messages = [
        new SystemMessage(APP_UNDERSTANDING_SYSTEM_PROMPT),
        new HumanMessage(formatAppUnderstandingPrompt(state.originalMessage)),
      ];

      this.logger.debug('Invoking LLM with app understanding tool...');
      const resultChunk = await llm.invoke(messages);
      const resultAIMessage = new AIMessage({
        content: resultChunk.content,
        id: resultChunk.id,
        tool_calls: resultChunk.tool_calls,
      });

      // Extract the tool call result
      const toolCall = resultChunk.tool_calls?.[0];
      if (!toolCall) {
        this.logger.error('No tool call found in LLM response');
        this.logger.debug('LLM response:', JSON.stringify(resultChunk, null, 2));
        throw new Error('No tool call found in LLM response');
      }

      this.logger.debug(`Tool call received: ${toolCall.name}`, toolCall.args);
      const rawSpec = toolCall.args as AppUnderstandingInput;

      // Validate and convert to ApplicationSpec
      const applicationSpec = this.validateAndConvertSpec(rawSpec);

      this.logger.debug('Validated application spec:', applicationSpec);
      this.logger.log(APPLICATION_LOG_MESSAGES.UNDERSTANDING_COMPLETED);

      return this.createSuccessResult({
        applicationSpec,
        messages: [...messages, resultAIMessage],
      });
    } catch (error) {
      this.logger.error('Error in application understanding:', error);
      return this.handleError(error, 'AppUnderstandingNode');
    }
  }

  private validateAndConvertSpec(spec: AppUnderstandingInput): ApplicationSpec {
    if (!spec.appName || typeof spec.appName !== 'string') {
      throw new Error(APPLICATION_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS + ': appName');
    }

    // Validate that appName is not empty after trimming
    if (spec.appName.trim().length === 0) {
      throw new Error(APPLICATION_ERROR_MESSAGES.INVALID_SPEC + ': appName cannot be empty');
    }

    // Ensure arrays are properly formatted
    if (spec.objects && !Array.isArray(spec.objects)) {
      throw new Error(APPLICATION_ERROR_MESSAGES.INVALID_SPEC + ': objects must be an array');
    }

    if (spec.layouts && !Array.isArray(spec.layouts)) {
      throw new Error(APPLICATION_ERROR_MESSAGES.INVALID_SPEC + ': layouts must be an array');
    }

    if (spec.flows && !Array.isArray(spec.flows)) {
      throw new Error(APPLICATION_ERROR_MESSAGES.INVALID_SPEC + ': flows must be an array');
    }

    return {
      appName: spec.appName,
      description: spec.description,
      objects: spec.objects,
      layouts: spec.layouts,
      flows: spec.flows,
      metadata: spec.metadata,
    };
  }
}
