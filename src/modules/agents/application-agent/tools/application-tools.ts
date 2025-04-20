import { FunctionTool } from 'openai/resources/responses/responses.mjs';

export const createNewApplicationTool: FunctionTool = {
  type: 'function',
  strict: true,
  name: 'ApiAppBuilderController_createApp',
  description: 'Create new application',
  parameters: {
    type: 'object',
    properties: {
      // customProps: {
      //   type: ['string', 'null'],
      //   description: 'Base64 custom properties',
      // },
      name: {
        type: 'string',
        description: 'Name of the application, should be unique and generated from the displayName',
      },
      displayName: {
        type: 'string',
        description: 'Display name of the application',
      },
      description: {
        type: ['string', 'null'],
        description: 'Description of the application',
      },
      profiles: {
        type: ['array', 'null'],
        items: {
          type: 'string',
          description: 'Profile name',
        },
        description: 'Profiles that the application will use',
      },
      tagNames: {
        type: ['array', 'null'],
        items: {
          type: 'string',
          description: 'Tag name',
        },
        description: 'Tag names that the application will use',
      },
      credentials: {
        type: ['array', 'null'],
        items: {
          type: 'string',
          description: 'Credential name',
        },
        description: 'Credentials that the application will use',
      },
    },
    required: [
      'name',
      'displayName',
      'description',
      'profiles',
      'tagNames',
      'credentials',
      // 'customProps',
    ],
    additionalProperties: false,
  },
};

export const updateApplicationTool: FunctionTool = {
  type: 'function',
  strict: true,
  name: 'ApiAppBuilderController_updateApp',
  description: 'Update application',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the application',
      },
      customProps: {
        type: 'string',
        description: 'Base64 custom properties',
      },
      displayName: {
        type: 'string',
        description: 'Display name of the application',
      },
      description: {
        type: 'string',
        description: 'Description of the application',
      },
      profiles: {
        type: 'array',
        items: {
          type: 'string',
          description: 'Profile name',
        },
        description: 'Profiles that the application will use',
      },
      credentials: {
        type: 'array',
        items: {
          type: 'string',
          description: 'Credential name',
        },
        description: 'Credentials that the application will use',
      },
    },
    required: ['name', 'displayName', 'description', 'profiles', 'credentials', 'customProps'],
    additionalProperties: false,
  },
};

export const updateApplicationLayoutsTool: FunctionTool = {
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
    additionalProperties: false,
  },
};
