import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextFile, ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { GenerateLayoutsParams, GenerateLayoutsResponse } from './types/layout.types';
import { LayoutErrors } from './constants/layout.constants';
import { tools as layoutTools } from './tools/layout-tools';

@Injectable()
export class LayoutService {
  private readonly logger = new Logger(LayoutService.name);
  private readonly AGENT_PATH = AGENT_PATHS.LAYOUT;
  private readonly CONTEXTS_PATH = 'contexts';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate layout definitions based on application features, components, and objects
   * @param params Parameters containing features, components, objects, and session information
   * @returns Layout definitions and suggested next steps
   */
  async generateLayouts(params: GenerateLayoutsParams): Promise<GenerateLayoutsResponse> {
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
        tool_choice: 'auto' as const,
      };

      const completion = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!completion.toolCalls?.length) {
        throw new Error(LayoutErrors.GENERATION_FAILED);
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
      this.logger.error('Layout generation failed', error);
      throw new Error(error instanceof Error ? error.message : LayoutErrors.GENERATION_FAILED);
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
      throw new Error(LayoutErrors.CONTEXT_LOAD_ERROR);
    }
  }
}
