import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { IntentAgentInput, IntentPlan, IntentToolResponse } from './types/intent.types';
import { IntentErrors } from './constants/intent.constants';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { tools as intentTools } from './tools/intent-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';
import { MemoryService } from 'src/modules/memory/memory.service';
import { ShortTermMemory } from 'src/modules/memory/types';

@Injectable()
export class IntentAgentService extends BaseAgentService<IntentAgentInput, IntentPlan> {
  constructor(
    openAIService: OpenAIService,
    contextLoader: ContextLoaderService,
    private readonly memoryService: MemoryService,
  ) {
    super(openAIService, contextLoader, AGENT_PATHS.INTENT);
  }

  async run(params: IntentAgentInput): Promise<IntentPlan> {
    return this.createIntentPlan(params);
  }

  private async createIntentPlan(params: IntentAgentInput): Promise<IntentPlan> {
    try {
      const { sessionId, message } = params;
      const shortTermMemory = await this.memoryService.getContext(sessionId);
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

  public summarizeShortTermMemory(context: ShortTermMemory): string {
    const apps = context.createdApplications.map((app) => `- ${app.name}`).join('\n');
    const objects = context.createdObjects.map((obj) => `- ${obj.name}`).join('\n');
    const layouts = context.createdLayouts.map((layout) => `- ${layout.name}`).join('\n');
    const flows = context.createdFlows.map((flow) => `- ${flow.name}`).join('\n');

    return `
      Here is the current state of the chat session:

      Created Applications:
      ${apps || '(none)'}

      Created Objects:
      ${objects || '(none)'}

      Created Layouts:
      ${layouts || '(none)'}

      Created Flows:
      ${flows || '(none)'}

      Use this memory to avoid duplicate creations and to resolve references like "the user object".
    `.trim();
  }
}
