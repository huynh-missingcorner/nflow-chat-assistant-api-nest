import { FunctionTool } from 'openai/resources/responses/responses.mjs';

export const tools: FunctionTool[] = [
  {
    name: 'ApiAppBuilderController_createApp',
    description: 'Create new application',
    parameters: {
      type: 'object',
      properties: {
        customProps: {
          type: 'string',
          description: 'Base64 custom properties',
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
        profiles: {
          type: 'array',
          items: {
            type: 'string',
            description: '',
          },
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
        credentials: {
          type: 'array',
          items: {
            type: 'string',
            description: '',
          },
          description: '',
        },
      },
      required: ['name', 'displayName'],
      additionalProperties: false,
    },
    strict: true,
    type: 'function',
  },
  {
    type: 'function',
    strict: true,
    name: 'ApiAppBuilderController_updateApp',
    description: 'Update application',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '',
        },
        customProps: {
          type: 'string',
          description: 'Base64 custom properties',
        },
        displayName: {
          type: 'string',
          description: '',
        },
        description: {
          type: 'string',
          description: '',
        },
        profiles: {
          type: 'array',
          items: {
            type: 'string',
            description: '',
          },
          description: '',
        },
        credentials: {
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
  {
    type: 'function',
    strict: true,
    name: 'ApiAppBuilderController_updateAppLayouts',
    description: 'Order app pages',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '',
        },
        layoutIds: {
          type: 'array',
          items: {
            type: 'string',
            description: '',
          },
          description: '',
        },
      },
      required: ['name', 'layoutIds'],
    },
  },
];
