import { FunctionTool } from 'openai/resources/responses/responses.mjs';

export const classifyMessageTool: FunctionTool = {
  type: 'function',
  name: 'ClassifierAgent_classifyMessage',
  description: 'Classify user message into one of: nflow_action, context_query, or casual_chat',
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['nflow_action', 'context_query', 'casual_chat'],
        description: 'Classification type for the message',
      },
      message: {
        type: 'string',
        description: 'The original message from the user',
      },
    },
    required: ['type', 'message'],
    additionalProperties: false,
  },
};
