import { ChatCompletionTool } from 'openai/resources/index.mjs';

export const createFlowTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'ApiFlowController_createFlow',
    description: 'Create new Flow and First Template',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the flow',
        },
        displayName: {
          type: 'string',
          description: 'Display name of the flow',
        },
        type: {
          type: 'string',
          description: 'Type of the flow',
          enum: ['screen', 'action', 'time-based', 'data', 'event', 'ai-chat'],
          default: 'screen',
        },
        description: {
          type: 'string',
          description: 'Description of the flow',
        },
        objectNameRefs: {
          type: 'array',
          items: {
            type: 'string',
            description: 'Object name references',
          },
          description: 'Object name references',
        },
      },
      required: ['name', 'displayName', 'type'],
    },
  },
};
