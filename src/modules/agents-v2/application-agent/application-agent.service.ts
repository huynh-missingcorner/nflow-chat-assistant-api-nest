import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { tools as applicationTools } from './tools/application-tools';
import { ApplicationAgentInput, ApplicationAgentOutput } from './types/application.types';
import { ApplicationErrors } from './constants/application.constants';
import { OPENAI_GPT_4_1 } from 'src/shared/infrastructure/langchain/models/openai/openai-models';
import { applicationSystemPrompt } from './constants/prompts';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';

@Injectable()
export class ApplicationAgentService implements OnModuleInit {
  private readonly logger = new Logger(ApplicationAgentService.name);
  private readonly agentCheckpointer = new MemorySaver();
  private agent: ReturnType<typeof createReactAgent>;

  onModuleInit() {
    this.agent = createReactAgent({
      llm: OPENAI_GPT_4_1,
      tools: applicationTools,
      checkpointer: this.agentCheckpointer,
    });
  }

  async run(input: ApplicationAgentInput): Promise<ApplicationAgentOutput> {
    try {
      const messages = [
        new SystemMessage(applicationSystemPrompt),
        new HumanMessage(input.message),
      ];

      const result = await this.agent.invoke(
        {
          messages,
        },
        {
          configurable: {
            thread_id: '123',
          },
        },
      );
      this.logger.log(result);

      // TODO: Process the result, for now the tool calls are executed right away
      return {
        success: true,
        message: 'Application generated successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Application generation failed', error);
      throw new Error(error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED);
    }
  }
}
