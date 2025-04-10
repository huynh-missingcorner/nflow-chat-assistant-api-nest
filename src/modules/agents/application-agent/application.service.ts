import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ContextFile, ContextLoaderService } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import {
  GenerateApplicationParams,
  GenerateApplicationResponse,
  ApplicationConfig,
} from './types/application.types';
import { ApplicationErrors, ApplicationDefaults } from './constants/application.constants';
import { tools as applicationTools } from './tools/application-tools';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  private readonly AGENT_PATH = AGENT_PATHS.APPLICATION;
  private readonly CONTEXTS_PATH = 'contexts';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly prisma: PrismaService,
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

      const options = { tools: applicationTools, tool_choice: 'auto' as const };

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

  /**
   * Parse and validate the OpenAI response
   * @param completion OpenAI completion string
   * @returns Parsed and validated response
   */
  private parseAndValidateResponse(completion: string): GenerateApplicationResponse {
    try {
      // Normalize completion string by removing special characters
      const normalizedCompletion = completion.replace(/[\n\r\t]/g, '').trim();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = JSON.parse(normalizedCompletion);
      // this.validateApplicationConfig(response.applicationPayload.payload.config);
      return response as GenerateApplicationResponse;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response', error);
      throw new Error(ApplicationErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate the generated application configuration
   * @param config Application configuration
   */
  private validateApplicationConfig(config: ApplicationConfig): void {
    const { features, components } = config;

    if (!Array.isArray(features) || !Array.isArray(components)) {
      throw new Error(ApplicationErrors.INVALID_INTENT);
    }

    const validFeatureTypes = Object.values(ApplicationDefaults.FEATURE_TYPES);
    const validComponentTypes = Object.values(ApplicationDefaults.LAYOUT_TYPES);

    const hasInvalidFeature = features.some((feature) => !validFeatureTypes.includes(feature.type));
    const hasInvalidComponent = components.some(
      (component) => !validComponentTypes.includes(component.type),
    );

    if (hasInvalidFeature || hasInvalidComponent) {
      throw new Error(ApplicationErrors.INVALID_COMPONENT_TYPE);
    }
  }

  /**
   * Log the application generation result
   * @param params Original generation parameters
   * @param response Generated response
   */
  private async logGeneration(
    params: GenerateApplicationParams,
    response: GenerateApplicationResponse,
  ): Promise<void> {
    try {
      await this.prisma.agentResult.create({
        data: {
          agentType: 'APPLICATION_AGENT',
          sessionId: crypto.randomUUID(),
          messageId: crypto.randomUUID(),
          input: JSON.stringify(params),
          output: JSON.stringify(response),
          status: 'COMPLETED',
          duration: 0,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log application generation', error);
    }
  }
}
