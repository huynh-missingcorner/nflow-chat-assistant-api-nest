import { Inject, Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

import {
  IntentClassifierOutput,
  IntentClassifierTool,
} from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';
import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';

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

      const classifiedIntent = await this.performClassification(messages);

      // Log the classified intents
      this.logger.debug(
        LOG_MESSAGES.INTENT_CLASSIFIED,
        `Found ${classifiedIntent.intents.length} intents`,
        classifiedIntent,
      );

      return this.createSuccessResult({
        classifiedIntent,
        messages: [...state.messages, ...messages],
      });
    } catch (error) {
      return this.handleError(error, 'intent classification');
    }
  }

  protected getNodeName(): string {
    return GRAPH_NODES.CLASSIFY_INTENT;
  }

  private async performClassification(
    messages: (HumanMessage | SystemMessage)[],
  ): Promise<IntentClassifierOutput> {
    const llmWithTools = OPENAI_GPT_4_1.bindTools([IntentClassifierTool]);
    const response = await llmWithTools.invoke(messages);

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
      ...classifiedIntents,
      intents: intentsWithIds,
    };
  }
}
