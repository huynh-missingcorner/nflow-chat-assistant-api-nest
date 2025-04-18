import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/shared/infrastructure/openai/openai.service';
import { classifyMessageTool } from './tools/classifier-tools';
import { ToolChoiceFunction } from 'openai/resources/responses/responses.mjs';

export type MessageType = 'nflow_action' | 'context_query' | 'casual_chat';

export interface ClassificationResult {
  type: MessageType;
  message: string;
}

@Injectable()
export class ClassifierAgentService {
  private readonly logger = new Logger(ClassifierAgentService.name);
  private readonly SYSTEM_PROMPT = `You are ClassifierAgent — a message classification agent in a multi-agent system for the Nflow platform.

Classify the user's message into one of:

1. "nflow_action" → Create/update/delete/read resources in Nflow (apps, objects, layouts, data).
2. "context_query" → Ask about what has been done in this session or memory.
3. "casual_chat" → Greetings, FAQs, or small talk.

Respond **only** in JSON format:
{ "type": "nflow_action" }
{ "type": "context_query" }
{ "type": "casual_chat" }

DO NOT explain. DO NOT include any other content.`;

  constructor(private readonly openAIService: OpenAIService) {}

  async classifyMessage(message: string): Promise<ClassificationResult> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: this.SYSTEM_PROMPT,
        },
        {
          role: 'user' as const,
          content: message,
        },
      ];

      const options = {
        tools: [classifyMessageTool],
        tool_choice: {
          type: 'function',
          name: 'RouterAgent_classifyMessage',
        } as ToolChoiceFunction,
        model: 'gpt-4.1',
        temperature: 0.2,
      };

      const completion = await this.openAIService.generateFunctionCompletion(messages, options);

      if (!completion.toolCalls?.length) {
        this.logger.warn('No classification tool call returned');
        // Default to nflow_action as a fallback
        return { type: 'nflow_action', message };
      }

      const toolCall = completion.toolCalls[0];
      const args = JSON.parse(toolCall.function.arguments) as ClassificationResult;

      this.logger.log(`Message classified as: ${args.type}`);
      return {
        type: args.type,
        message,
      };
    } catch (error) {
      this.logger.error('Error classifying message', error);
      // Default to nflow_action on error
      return { type: 'nflow_action', message };
    }
  }
}
