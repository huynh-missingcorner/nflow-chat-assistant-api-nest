import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { ExtractedIntent, ExtractIntentParams } from './types/intent.types';
import { IntentErrors } from './constants/intent.constants';
import { ContextLoaderService, ContextFile } from 'src/shared/services/context-loader.service';
import { AGENT_PATHS } from 'src/shared/constants/agent-paths.constants';
import { tools, IntentToolResponse, IntentPlan } from './tools/intent-tools';

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);
  private readonly AGENT_PATH = AGENT_PATHS.INTENT;
  private readonly CONTEXTS_PATH = 'contexts';

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly contextLoader: ContextLoaderService,
  ) {}

  /**
   * Extracts features, components, and goals from a user's prompt
   * @param params The extraction parameters containing message and optional chat context
   * @returns Structured intent data including features, components, and summary
   */
  async extractIntent(params: ExtractIntentParams): Promise<IntentPlan> {
    try {
      const combinedContext = await this.loadAgentContexts();

      const messages = [
        {
          role: 'system' as const,
          content: combinedContext,
        },
        ...(params.chatContext || []),
        { role: 'user' as const, content: params.message },
      ];

      const options = {
        tools,
        tool_choice: { type: 'function', function: { name: 'create_intent_plan' } } as const,
      };

      const response = await this.openAIService.generateFunctionCompletion(messages, options);
      if (!response.toolCalls?.[0]) {
        throw new Error(IntentErrors.EXTRACTION_ERROR);
      }

      const toolCall = response.toolCalls[0] as IntentToolResponse;
      try {
        const intentPlan = JSON.parse(toolCall.function.arguments) as IntentPlan;
        return intentPlan;
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
   * Loads and combines all context files for the intent agent
   * @returns Combined context content as string
   * @private
   */
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
      throw new Error(IntentErrors.CONTEXT_LOAD_ERROR);
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
