import { Injectable } from '@nestjs/common';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';

import { AGENT_PATHS } from '@/shared/constants/agent-paths.constants';
import { OpenAIService } from '@/shared/infrastructure/openai/openai.service';
import { ContextLoaderService } from '@/shared/services/context-loader.service';

import { BaseAgentService } from '../base-agent.service';
import { AgentInput, AgentOutput, ToolCall } from '../types';
import { FlowErrors } from './constants/flow.constants';
import { createFlowTool } from './tools/flow-tools';
import { FlowAgentInput } from './types/flow.types';

@Injectable()
export class FlowAgentService extends BaseAgentService<AgentInput<FlowAgentInput>, AgentOutput> {
  constructor(openAIService: OpenAIService, contextLoader: ContextLoaderService) {
    super(openAIService, contextLoader, AGENT_PATHS.FLOW);
  }

  async run(input: AgentInput<FlowAgentInput>): Promise<AgentOutput> {
    return this.generateFlows(input.taskData);
  }

  private async generateFlows(params: FlowAgentInput): Promise<AgentOutput> {
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
      this.logger.error('Flow generation failed', error);
      throw new Error(error instanceof Error ? error.message : FlowErrors.GENERATION_FAILED);
    }
  }
}
