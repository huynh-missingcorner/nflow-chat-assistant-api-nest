import { Injectable, Logger } from '@nestjs/common';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';

import { OpenAIService } from '@/shared/infrastructure/openai/openai.service';

import { ChatMessage } from '../types';
import { CLASSIFIER_ERRORS, CLASSIFIER_PROMPTS } from './constants/classifier.constants';
import { classifyMessageTool } from './tools/classifier-tools';
import { ClassificationResult, MessageType } from './types/classifier.types';

@Injectable()
export class ClassifierAgentService {
  private readonly logger = new Logger(ClassifierAgentService.name);

  constructor(private readonly openAIService: OpenAIService) {}

  async classifyMessage(message: string): Promise<ClassificationResult> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: CLASSIFIER_PROMPTS.SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: message,
        },
      ];

      const options = {
        tools: [classifyMessageTool],
        tool_choice: {
          type: 'function',
          name: 'ClassifierAgent_classifyMessage',
        } as ToolChoiceFunction,
        model: 'gpt-4.1',
        temperature: 0.2,
      };

      const completion = await this.openAIService.generateFunctionCompletion(messages, options);

      if (!completion.toolCalls?.length) {
        this.logger.warn(CLASSIFIER_ERRORS.INVALID_RESPONSE);
        return this.getDefaultClassification(message);
      }

      const toolCall = completion.toolCalls[0];
      const args = JSON.parse(toolCall.function.arguments) as ClassificationResult;

      this.logger.log(`Message classified as: ${args.type}`);

      return {
        type: this.validateMessageType(args.type),
        message,
      };
    } catch (error) {
      this.handleClassificationError(error);
      return this.getDefaultClassification(message);
    }
  }

  private validateMessageType(type: string): MessageType {
    const validTypes: MessageType[] = ['nflow_action', 'context_query', 'casual_chat'];

    if (validTypes.includes(type as MessageType)) {
      return type as MessageType;
    }

    this.logger.warn(`Invalid message type "${type}" returned, defaulting to "nflow_action"`);
    return 'nflow_action';
  }

  private handleClassificationError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : CLASSIFIER_ERRORS.CLASSIFICATION_FAILED;

    this.logger.error(
      `${CLASSIFIER_ERRORS.CLASSIFICATION_FAILED}: ${errorMessage}`,
      error instanceof Error ? error.stack : undefined,
    );
  }

  private getDefaultClassification(message: string): ClassificationResult {
    return {
      type: 'nflow_action',
      message,
    };
  }
}
