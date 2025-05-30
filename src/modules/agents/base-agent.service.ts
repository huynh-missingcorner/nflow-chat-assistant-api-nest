import { Logger } from '@nestjs/common';

import { OpenAIService } from '@/shared/infrastructure/openai/openai.service';
import { ContextFile, ContextLoaderService } from '@/shared/services/context-loader.service';

import { IntentErrors } from './intent-agent/constants/intent.constants';

export abstract class BaseAgentService<TInput, TOutput> {
  protected readonly logger: Logger;
  protected readonly CONTEXTS_PATH = 'contexts';

  constructor(
    protected readonly openAIService: OpenAIService,
    protected readonly contextLoader: ContextLoaderService,
    protected readonly agentPath: string,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Abstract method that each agent must implement to process their specific logic
   * @param input The input data for the agent
   * @returns A promise with the processed output
   */
  abstract run(input: TInput): Promise<TOutput>;

  /**
   * Loads and combines all context files for the agent
   * @returns Combined context content as string
   * @protected
   */
  protected async loadAgentContexts(): Promise<string> {
    try {
      const contextFiles = await this.contextLoader.loadContextDirectory(
        `${this.agentPath}/${this.CONTEXTS_PATH}`,
      );

      return contextFiles
        .map((file: ContextFile) => `# ${file.name}\n\n${file.content}`)
        .join('\n\n---\n\n');
    } catch (error) {
      this.logger.error('Failed to load agent contexts', error);
      throw new Error(IntentErrors.CONTEXT_LOAD_ERROR);
    }
  }
}
