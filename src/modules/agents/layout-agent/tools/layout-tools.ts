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
            description:
              'Name of the layout to create (will be automatically made unique with timestamp).',
          },
          displayName: {
            type: 'string',
            description: 'Display name of the layout',
          },
          description: {
            type: 'string',
            description: 'Description of the layout',
          },
          type: {
            type: 'string',
            description: 'Type of the layout',
            enum: ['dashboard', 'app-page', 'record-page'],
            default: 'app-page',
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
