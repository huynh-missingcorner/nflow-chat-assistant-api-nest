import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { ApplicationAgentInput, ApplicationAgentOutput } from './types/application.types';
import { ApplicationErrors } from './constants/application.constants';
import { tools as applicationTools } from './tools/application-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';

@Injectable()
export class ApplicationAgentService extends BaseAgentService<
  ApplicationAgentInput,
  ApplicationAgentOutput
> {
  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.APPLICATION);
  }

  async run(params: ApplicationAgentInput): Promise<ApplicationAgentOutput> {
    return this.generateApplication(params);
  }

  private async generateApplication(
    params: ApplicationAgentInput,
  ): Promise<ApplicationAgentOutput> {
    try {
      const combinedContext = await this.loadAgentContexts();

      const messages = [
        {
          role: 'system' as const,
          content: combinedContext,
        },
        {
          role: 'user' as const,
          content: `Application Parameters: ${JSON.stringify(params, null, 2)}`,
        },
      ];

      const options = {
        tools: applicationTools,
        tool_choice: {
          type: 'function',
          name: 'ApiAppBuilderController_createApp',
        } as ToolChoiceFunction,
      };

      const response = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!response.toolCalls?.length) {
        throw new Error(ApplicationErrors.GENERATION_FAILED);
      }

      const toolCalls = response.toolCalls.map((toolCall, index) => {
        const functionCall = toolCall.function;
        return {
          order: index,
          toolCall: {
            functionName: functionCall.name,
            arguments: JSON.parse(functionCall.arguments) as Record<string, unknown>,
          },
        };
      });

      return {
        toolCalls,
        metadata: {},
      };
    } catch (error) {
      this.logger.error('Application generation failed', error);
      throw new Error(error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED);
    }
  }
}
