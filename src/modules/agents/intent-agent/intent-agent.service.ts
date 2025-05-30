import { Inject, Injectable } from '@nestjs/common';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { ShortTermMemory } from 'src/modules/memory/types';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';

import { MEMORY_SERVICE } from '@/modules/memory/const';
import { IMemoryService } from '@/modules/memory/interfaces';

import { BaseAgentService } from '../base-agent.service';
import { IntentErrors } from './constants/intent.constants';
import { tools as intentTools } from './tools/intent-tools';
import { IntentAgentInput, IntentPlan, IntentToolResponse } from './types/intent.types';

@Injectable()
export class IntentAgentService extends BaseAgentService<IntentAgentInput, IntentPlan> {
  constructor(
    openAIService: OpenAIService,
    contextLoader: ContextLoaderService,
    @Inject(MEMORY_SERVICE) private readonly memoryService: IMemoryService,
  ) {
    super(openAIService, contextLoader, AGENT_PATHS.INTENT);
  }

  async run(params: IntentAgentInput): Promise<IntentPlan> {
    return this.createIntentPlan(params);
  }

  private async createIntentPlan(params: IntentAgentInput): Promise<IntentPlan> {
    try {
      const { chatSessionId, message } = params;
      const shortTermMemory = await this.memoryService.getContext(chatSessionId);
      const baseContext = await this.loadAgentContexts();
      const memorySummary = this.summarizeShortTermMemory(shortTermMemory);
      const combinedContext = `
        ${baseContext}

        ${memorySummary}
      `.trim();

      const messages = [
        {
          role: 'system' as const,
          content: combinedContext,
        },
        ...shortTermMemory.chatHistory,
        { role: 'user' as const, content: message },
      ];

      const options = {
        tools: intentTools,
        tool_choice: { type: 'function', name: 'create_intent_plan' } as ToolChoiceFunction,
      };

      const response = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!response.toolCalls?.length) {
        throw new Error(IntentErrors.EXTRACTION_ERROR);
      }

      const toolCall = response.toolCalls[0] as IntentToolResponse;
      try {
        const intentPlan = JSON.parse(toolCall.function.arguments) as IntentPlan;
        intentPlan.originalMessage = message;
        return intentPlan;
      } catch (parseError) {
        this.logger.error('Failed to parse OpenAI response', parseError);
        throw new Error(IntentErrors.PARSE_ERROR);
      }
    } catch (error) {
      this.logger.error('Intent extraction failed', error);
      throw new Error(IntentErrors.EXTRACTION_ERROR);
    }
  }

  private summarizeShortTermMemory(context: ShortTermMemory): string {
    const apps = context.createdApplications;
    const objects = context.createdObjects;
    const layouts = context.createdLayouts;
    const flows = context.createdFlows;

    return `
      ## Short Term Memory

      Here is the current state of the chat session:

      Created Applications:
      ${apps ? JSON.stringify(apps) : '(none)'}

      Created Objects:
      ${objects ? JSON.stringify(objects) : '(none)'}

      Created Layouts:
      ${layouts ? JSON.stringify(layouts) : '(none)'}

      Created Flows:
      ${flows ? JSON.stringify(flows) : '(none)'}

      Use this memory to avoid duplicate creations and to resolve references like "the user object".
    `.trim();
  }
}
