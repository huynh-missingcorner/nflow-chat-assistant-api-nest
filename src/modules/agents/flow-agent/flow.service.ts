import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextFile, ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { GenerateFlowsParams, GenerateFlowsResponse } from './types/flow.types';
import { FlowErrors } from './constants/flow.constants';
import { createFlowTool } from './tools/flow-tools';
@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);
  private readonly AGENT_PATH = AGENT_PATHS.FLOW;
  private readonly CONTEXTS_PATH = 'contexts';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate flow definitions based on application features, components, objects, and layouts
   * @param params Parameters containing features, components, objects, layouts, and session information
   * @returns Flow definitions and suggested next steps
   */
  async generateFlows(params: GenerateFlowsParams): Promise<GenerateFlowsResponse> {
    try {
      // Load context from file
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
          function: { name: 'ApiFlowController_createFlow' },
        } as const,
      };

      const completion = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!completion.toolCalls?.length) {
        throw new Error(FlowErrors.GENERATION_FAILED);
      }

      // Process all tool calls and organize them
      const toolCalls = completion.toolCalls.map((toolCall, index) => {
        const functionCall = toolCall.function;
        return {
          order: index,
          toolCall: {
            functionName: functionCall.name,
            arguments: JSON.parse(functionCall.arguments) as Record<string, unknown>,
          },
        };
      });

      // Return structured response with all tool calls
      return {
        toolCalls,
        metadata: {
          // Additional metadata can be added here
        },
      };
    } catch (error) {
      this.logger.error('Flow generation failed', error);
      throw new Error(error instanceof Error ? error.message : FlowErrors.GENERATION_FAILED);
    }
  }

  private async loadAgentContexts(): Promise<string> {
    try {
      const contextFiles = await this.contextLoader.loadContextDirectory(
        `${this.AGENT_PATH}/${this.CONTEXTS_PATH}`,
      );

      return contextFiles
        .map((file: ContextFile) => `# ${file.name}\n\n${file.content}`)
        .join('\n\n---\n\n');
    } catch (error) {
      this.logger.error('Failed to load agent contexts', error);
      throw new Error(FlowErrors.CONTEXT_LOAD_ERROR);
    }
  }
}
