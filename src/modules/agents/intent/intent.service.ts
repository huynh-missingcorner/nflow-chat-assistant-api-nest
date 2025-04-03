import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { ExtractedIntent, ExtractIntentParams } from './types/intent.types';
import { IntentPrompts } from './prompts/intent.prompts';
import { IntentErrors } from './constants/intent.constants';

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);

  constructor(private readonly openAIService: OpenAIService) {}

  /**
   * Extracts features, components, and goals from a user's prompt
   * @param params The extraction parameters containing message and optional chat context
   * @returns Structured intent data including features, components, and summary
   */
  async extractIntent(params: ExtractIntentParams): Promise<ExtractedIntent> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: IntentPrompts.FEATURE_EXTRACTION,
        },
        ...(params.chatContext || []),
        { role: 'user' as const, content: params.message },
        {
          role: 'system' as const,
          content: IntentPrompts.RESPONSE_FORMAT,
        },
      ];

      const response = await this.openAIService.generateChatCompletion(messages);

      try {
        const parsedResponse = JSON.parse(response) as ExtractedIntent;
        this.validateExtractedIntent(parsedResponse);
        return parsedResponse;
      } catch (parseError) {
        this.logger.error('Failed to parse OpenAI response', parseError);
        throw new Error(IntentErrors.PARSE_ERROR);
      }
    } catch (error) {
      this.logger.error('Intent extraction failed', error);
      throw new Error(IntentErrors.EXTRACTION_ERROR);
    }
  }

  /**
   * Validates the structure of extracted intent data
   * @param intent The extracted intent to validate
   * @throws Error if the intent structure is invalid
   */
  private validateExtractedIntent(intent: ExtractedIntent): void {
    if (
      !Array.isArray(intent.features) ||
      !Array.isArray(intent.components) ||
      typeof intent.summary !== 'string'
    ) {
      throw new Error(IntentErrors.INVALID_STRUCTURE);
    }

    if (intent.features.length === 0 || intent.components.length === 0 || !intent.summary.trim()) {
      throw new Error(IntentErrors.MISSING_DATA);
    }
  }
}
