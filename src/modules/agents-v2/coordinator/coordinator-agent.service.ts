import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

import { OPENAI_GPT_4_1 } from '@/shared/infrastructure/langchain/models/openai/openai-models';
import { loadFileContent } from '@/shared/utils';

import { ApplicationErrors } from '../application/constants';
import { IntentClassifierTool } from './tools/intent-classifier.tool';
import { CoordinatorAgentInput, CoordinatorAgentOutput } from './types/coordinator-agent.types';

@Injectable()
export class CoordinatorAgentService implements OnModuleInit {
  private readonly logger = new Logger(CoordinatorAgentService.name);
  private readonly agentCheckpointer = new MemorySaver();

  private agent: ReturnType<typeof createReactAgent>;
  private systemPrompt: string;

  onModuleInit() {
    this.systemPrompt = loadFileContent(
      'src/modules/agents-v2/coordinator/context/coordinator-agent-system-prompt.md',
    );

    this.agent = createReactAgent({
      llm: OPENAI_GPT_4_1,
      tools: [IntentClassifierTool],
      checkpointer: this.agentCheckpointer,
    });
  }

  async run(input: CoordinatorAgentInput): Promise<CoordinatorAgentOutput> {
    try {
      this.logger.log(`Processing user request: ${input.message}`);

      const messages = [new SystemMessage(this.systemPrompt), new HumanMessage(input.message)];

      const result = await this.agent.invoke(
        {
          messages,
        },
        {
          configurable: {
            thread_id: input.chatSessionId || 'default-session',
            tool_choice: IntentClassifierTool.name,
          },
        },
      );

      this.logger.debug('Agent execution result:', result);

      return {
        success: true,
        message: 'User intent classified successfully',
        data: {
          originalMessage: input.message,
          chatSessionId: input.chatSessionId,
        },
      };
    } catch (error) {
      this.logger.error('Intent classification failed', error);

      return {
        success: false,
        message: 'Failed to classify user intent',
        data: {
          error: error instanceof Error ? error.message : ApplicationErrors.GENERATION_FAILED,
        },
      };
    }
  }
}
