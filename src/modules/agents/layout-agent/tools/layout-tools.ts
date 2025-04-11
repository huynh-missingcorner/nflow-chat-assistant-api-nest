import { ChatCompletionTool } from 'openai/resources/index.mjs';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'ApiLayoutBuilderController_createLayout',
      description: 'Create Layout',
      parameters: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Only required for record-page',
          },
          name: {
            type: 'string',
            description: '',
          },
          displayName: {
            type: 'string',
            description: '',
          },
          description: {
            type: 'string',
            description: '',
          },
          type: {
            type: 'string',
            description: '',
            enum: ['dashboard', 'app-page', 'record-page'],
          },
        },
        required: ['name', 'displayName', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ApiLayoutBuilderController_updateLayout',
      description: 'Update Layout',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '',
          },
          displayName: {
            type: 'string',
            description: '',
          },
          description: {
            type: 'string',
            description: '',
          },
          tagNames: {
            type: 'array',
            items: {
              type: 'string',
              description: '',
            },
            description: '',
          },
        },
        required: ['name'],
      },
    },
  },
];
