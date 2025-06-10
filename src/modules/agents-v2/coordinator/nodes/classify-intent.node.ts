import { Inject, Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

import {
  IntentClassifierOutput,
  IntentClassifierTool,
} from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';
import { OPENAI_GPT_4_1_FOR_TOOLS } from '@/shared/infrastructure/langchain/models/openai/openai-models';

import { GRAPH_NODES, LOG_MESSAGES, VALIDATION_MESSAGES } from '../constants/graph-constants';
import { COORDINATOR_SYSTEM_PROMPT } from '../constants/tokens';
import { CoordinatorStateType } from '../types/graph-state.types';
import { GraphNodeBase } from './graph-node.base';

@Injectable()
export class ClassifyIntentNode extends GraphNodeBase {
  constructor(@Inject(COORDINATOR_SYSTEM_PROMPT) private readonly systemPrompt: string) {
    super();
  }

  async execute(state: CoordinatorStateType): Promise<Partial<CoordinatorStateType>> {
    try {
      this.logger.debug(LOG_MESSAGES.CLASSIFYING_INTENT(state.originalMessage));

      const messages = [
        new SystemMessage(this.systemPrompt),
        new HumanMessage(state.originalMessage),
      ];

      const { classifiedIntent, classifiedMessage } = await this.performClassification(messages);

      // Log the classified intents
      this.logger.debug(
        LOG_MESSAGES.INTENT_CLASSIFIED,
        `Found ${classifiedIntent.intents.length} intents`,
        classifiedIntent,
      );

      return this.createSuccessResult({
        classifiedIntent,
        messages: [...messages, classifiedMessage],
      });
    } catch (error) {
      return this.handleError(error, 'intent classification');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.CLASSIFY_INTENT;
  }

  private async performClassification(messages: (HumanMessage | SystemMessage)[]): Promise<{
    classifiedIntent: IntentClassifierOutput;
    classifiedMessage: BaseMessage;
  }> {
    const llmWithTools = OPENAI_GPT_4_1_FOR_TOOLS.bindTools([IntentClassifierTool]);
    const response = await llmWithTools.invoke(messages);
    const resultAiMessage = new AIMessage({
      content: response.content,
      id: response.id,
      tool_calls: response.tool_calls,
    });

    if (!response.tool_calls || response.tool_calls.length === 0) {
      throw new Error(VALIDATION_MESSAGES.NO_TOOL_CALLS);
    }

    const toolCall = response.tool_calls[0];
    const classifiedIntents = toolCall.args as IntentClassifierOutput;

    // Generate unique IDs for each intent
    const intentsWithIds = classifiedIntents.intents.map((intent) => ({
      ...intent,
      id: uuidv4(),
    }));

    return {
      classifiedIntent: {
        ...classifiedIntents,
        intents: intentsWithIds,
      },
      classifiedMessage: resultAiMessage,
    };
  }
}
