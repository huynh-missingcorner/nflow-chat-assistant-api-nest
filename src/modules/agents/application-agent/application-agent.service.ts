import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { ApplicationAgentInput } from './types/application.types';
import { ApplicationErrors } from './constants/application.constants';
import { createNewApplicationTool, updateApplicationTool } from './tools/application-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';
import { AgentInput, AgentOutput, ToolCall } from '../types';

@Injectable()
export class ApplicationAgentService extends BaseAgentService<
  AgentInput<ApplicationAgentInput>,
  AgentOutput
> {
  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.APPLICATION);
  }

  async run(input: AgentInput<ApplicationAgentInput>): Promise<AgentOutput> {
    return this.generateApplication(input.taskData);
  }

  private async generateApplication(params: ApplicationAgentInput): Promise<AgentOutput> {
    try {
      const combinedContext = await this.loadAgentContexts();

      const combinedPrompt = `
Create the following application:

Application Parameters: ${JSON.stringify(params, null, 2)}

Requirements:
1. First create the application using ApiAppBuilderController_createApp
2. For application parameters, use the following:
   - displayName: Use a name that is easy to understand and remember
   - description: Use a description that is easy to understand and remember
   - name: Name should be unique and generated from the displayName. Use the following format: ${params.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}
3. Important: If any of the parameters are null, do not include them in the tool call arguments.
`;
      const messages = [
        {
          role: 'system' as const,
          content: combinedContext,
        },
        {
          role: 'user' as const,
          content: combinedPrompt,
        },
      ];

      const options = {
        tools: [createNewApplicationTool, updateApplicationTool],
        tool_choice: {
          type: 'function',
          name: 'ApiAppBuilderController_createApp',
        } as ToolChoiceFunction,
        model: 'gpt-4.1',
        max_output_tokens: 32000,
        temperature: 0.2,
      };

      const response = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!response.toolCalls?.length) {
        throw new Error(ApplicationErrors.GENERATION_FAILED);
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
      this.logger.error('Application generation failed', error);
      throw new Error(error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED);
    }
  }
}
