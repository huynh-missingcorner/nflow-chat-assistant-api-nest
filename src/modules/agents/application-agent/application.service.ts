import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  GenerateApplicationParams,
  GenerateApplicationResponse,
  ApplicationConfig,
} from './types/application.types';
import {
  ApplicationErrors,
  ApplicationPrompts,
  ApplicationDefaults,
} from './constants/application.constants';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly prisma: PrismaService,
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
      this.validateIntent(params.intent);

      const messages = [
        {
          role: 'system' as const,
          content: ApplicationPrompts.SYSTEM_CONTEXT,
        },
        {
          role: 'user' as const,
          content: `${ApplicationPrompts.FEATURE_ANALYSIS}\n\nIntent: ${JSON.stringify(
            params.intent,
            null,
            2,
          )}`,
        },
        {
          role: 'system' as const,
          content: ApplicationPrompts.RESPONSE_FORMAT,
        },
      ];

      const completion = await this.openAIService.generateChatCompletion(messages);
      const response = this.parseAndValidateResponse(completion);

      await this.logGeneration(params, response);

      return response;
    } catch (error) {
      this.logger.error('Application generation failed', error);
      throw new Error(error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED);
    }
  }

  /**
   * Validate the intent data structure
   * @param intent User intent data
   */
  private validateIntent(intent: GenerateApplicationParams['intent']): void {
    if (!intent || !Array.isArray(intent.features) || !Array.isArray(intent.components)) {
      throw new Error(ApplicationErrors.INVALID_INTENT);
    }

    if (intent.features.length === 0 || intent.components.length === 0) {
      throw new Error(ApplicationErrors.MISSING_REQUIRED_FEATURES);
    }
  }

  /**
   * Parse and validate the OpenAI response
   * @param completion OpenAI completion string
   * @returns Parsed and validated response
   */
  private parseAndValidateResponse(completion: string): GenerateApplicationResponse {
    try {
      const response = JSON.parse(completion) as GenerateApplicationResponse;
      this.validateApplicationConfig(response.applicationPayload.payload.config);
      return response;
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
          sessionId: params.sessionId,
          messageId: params.messageId,
          input: JSON.stringify(params.intent),
          output: JSON.stringify(response),
          status: 'COMPLETED',
          duration: 0, // TODO: Add actual duration tracking
        },
      });
    } catch (error) {
      this.logger.error('Failed to log application generation', error);
    }
  }
}
