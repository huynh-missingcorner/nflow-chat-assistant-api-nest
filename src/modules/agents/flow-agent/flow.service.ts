import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { GenerateFlowsParams, GenerateFlowsResponse } from './types/flow.types';
import { FlowErrors } from './constants/flow.constants';
import { createFlowTool } from './tools/flow-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';
import { BaseAgentService } from '../base-agent.service';

@Injectable()
export class FlowService extends BaseAgentService<GenerateFlowsParams, GenerateFlowsResponse> {
  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.FLOW);
  }

  async run(params: GenerateFlowsParams): Promise<GenerateFlowsResponse> {
    return this.generateFlows(params);
  }

  private async generateFlows(params: GenerateFlowsParams): Promise<GenerateFlowsResponse> {
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
        tools: [createFlowTool],
        tool_choice: {
          type: 'function',
          name: 'ApiFlowController_createFlow',
        } as ToolChoiceFunction,
      };

      const response = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!response.toolCalls?.length) {
        throw new Error(FlowErrors.GENERATION_FAILED);
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
      this.logger.error('Flow generation failed', error);
      throw new Error(error instanceof Error ? error.message : FlowErrors.GENERATION_FAILED);
    }
  }
}
