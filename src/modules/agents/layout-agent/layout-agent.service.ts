import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { LayoutAgentInput } from './types/layout.types';
import { LayoutErrors } from './constants/layout.constants';
import { tools as layoutTools } from './tools/layout-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';
import { AgentInput, AgentOutput, ToolCall } from '../types';

@Injectable()
export class LayoutAgentService extends BaseAgentService<
  AgentInput<LayoutAgentInput>,
  AgentOutput
> {
  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.LAYOUT);
  }

  async run(input: AgentInput<LayoutAgentInput>): Promise<AgentOutput> {
    return this.generateLayouts(input.taskData);
  }

  private async generateLayouts(params: LayoutAgentInput): Promise<AgentOutput> {
    try {
      const combinedContext = await this.loadAgentContexts();

      const messages = [
        {
          role: 'system' as const,
          content: combinedContext,
        },
        {
          role: 'user' as const,
          content: `Layout Parameters: ${JSON.stringify(params, null, 2)}`,
        },
      ];

      const options = {
        tools: layoutTools,
        tool_choice: {
          type: 'function',
          name: 'ApiLayoutBuilderController_createLayout',
        } as ToolChoiceFunction,
      };

      const response = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!response.toolCalls?.length) {
        throw new Error(LayoutErrors.GENERATION_FAILED);
      }

      const toolCalls: ToolCall[] = response.toolCalls.map((toolCall) => {
        const functionCall = toolCall.function;
        return {
          id: toolCall.id,
          functionName: functionCall.name,
          arguments: JSON.parse(functionCall.arguments) as Record<string, unknown>,
        };
      });

      return {
        toolCalls,
      };
    } catch (error) {
      this.logger.error('Layout generation failed', error);
      throw new Error(error instanceof Error ? error.message : LayoutErrors.GENERATION_FAILED);
    }
  }
}
