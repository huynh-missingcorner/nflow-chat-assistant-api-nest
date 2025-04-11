import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ContextFile, ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { GenerateApplicationParams, GenerateApplicationResponse } from './types/application.types';
import { ApplicationErrors } from './constants/application.constants';
import { tools as applicationTools } from './tools/application-tools';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  private readonly AGENT_PATH = AGENT_PATHS.APPLICATION;
  private readonly CONTEXTS_PATH = 'contexts';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Generate application configuration based on user intent
   * @param params Parameters containing intent and session information
   * @returns Application payload and suggested next steps
   */
  async generateApplication(
    params: GenerateApplicationParams,
  ): Promise<GenerateApplicationResponse> {
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
          content: `Application Parameters: ${JSON.stringify(params, null, 2)}`,
        },
      ];

      const options = {
        tools: applicationTools,
        tool_choice: {
          type: 'function',
          function: { name: 'ApiAppBuilderController_createApp' },
        } as const,
      };

      const completion = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!completion.toolCalls?.length) {
        throw new Error(ApplicationErrors.GENERATION_FAILED);
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
      this.logger.error('Application generation failed', error);
      throw new Error(error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED);
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
      throw new Error(ApplicationErrors.CONTEXT_LOAD_ERROR);
    }
  }
}
