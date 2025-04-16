import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ExtractIntentParams, IntentPlan, IntentToolResponse } from './types/intent.types';
import { IntentErrors } from './constants/intent.constants';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { tools as intentTools } from './tools/intent-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';

@Injectable()
export class IntentService extends BaseAgentService<ExtractIntentParams, IntentPlan> {
  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.INTENT);
  }

  async run(params: ExtractIntentParams): Promise<IntentPlan> {
    return this.createIntentPlan(params);
  }

  private async createIntentPlan(params: ExtractIntentParams): Promise<IntentPlan> {
    try {
      const combinedContext = await this.loadAgentContexts();

      const messages = [
        {
          role: 'system' as const,
          content: combinedContext,
        },
        ...(params.chatContext || []),
        { role: 'user' as const, content: params.message },
      ];

      const options = {
        tools: intentTools,
        tool_choice: { type: 'function', name: 'create_intent_plan' } as ToolChoiceFunction,
      };

      const response = await this.openAIService.generateFunctionCompletion(
        messages,
        options,
        params.functionCallInputs,
      );
      if (!response.toolCalls?.length) {
        throw new Error(IntentErrors.EXTRACTION_ERROR);
      }

      const toolCall = response.toolCalls[0] as IntentToolResponse;
      try {
        const intentPlan = JSON.parse(toolCall.function.arguments) as IntentPlan;
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
}
