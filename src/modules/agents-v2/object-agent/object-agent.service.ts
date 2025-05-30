import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { OPENAI_GPT_4_1 } from 'src/shared/infrastructure/langchain/models/openai/openai-models';
import { ObjectAgentInput } from './types/object.types';
import { ObjectAgentOutput } from './types/object.types';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ObjectPrompts } from './constants/prompts';
import { ObjectErrors } from './constants/object.constants';
import { tools as objectTools } from './tools/object-tools';

@Injectable()
export class ObjectAgentService implements OnModuleInit {
  private readonly logger = new Logger(ObjectAgentService.name);
  private readonly agentCheckpointer = new MemorySaver();
  private agent: ReturnType<typeof createReactAgent>;

  onModuleInit() {
    this.agent = createReactAgent({
      llm: OPENAI_GPT_4_1,
      tools: objectTools,
      checkpointer: this.agentCheckpointer,
    });
  }

  async run(input: ObjectAgentInput): Promise<ObjectAgentOutput> {
    try {
      const messages = [
        new SystemMessage(ObjectPrompts.OBJECT_DESIGN_PROMPT),
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

      // Extract the content from the last message
      const allMessages = result.messages as BaseMessage[];
      const lastMessage = allMessages[allMessages.length - 1];
      const responseMessage = typeof lastMessage.content === 'string' ? lastMessage.content : '';

      return {
        success: true,
        message: responseMessage,
        data: result,
      };
    } catch (error) {
      this.logger.error('Application generation failed', error);
      throw new Error(error instanceof Error ? error.message : ObjectErrors.GENERATION_FAILED);
    }
  }
}
