import { ChatCompletionTool } from 'openai/resources/index.mjs';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'ApiAppBuilderController_createApp',
      description: 'Create new application',
      parameters: {
        type: 'object',
        properties: {
          'x-nc-lang': {
            type: 'string',
            description: 'current user language',
            enum: ['en', 'vi'],
            default: 'en',
          },
          'x-nc-tenant': {
            type: 'string',
            description: 'org tenant',
          },
          'x-nc-payload': {
            type: 'string',
            description: 'Payload with one of JSON.stringify(object) then Base64',
          },
          'x-nc-date': {
            type: 'string',
            description: 'Timestamp of current date time',
          },
          'x-nc-signature': {
            type: 'string',
            description:
              'Required fields: algorithm, headers, signature. Algorithm only support HmacSHA256, headers: all header need to sign seperated by space, signature: HMAC SHA-256 of headers value seperated by "\n" in base64 format.',
          },
          'x-nc-digest': {
            type: 'string',
            description:
              'HMAC SHA-256 of the body content in base64 format, use JSON.stringify to convert body to string, add "SHA-256=" at the beginning',
          },
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
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ApiAppBuilderController_updateApp',
      description: 'Update application',
      parameters: {
        type: 'object',
        properties: {
          'x-nc-lang': {
            type: 'string',
            description: 'current user language',
            enum: ['en', 'vi'],
            default: 'en',
          },
          'x-nc-tenant': {
            type: 'string',
            description: 'org tenant',
          },
          'x-nc-payload': {
            type: 'string',
            description: 'Payload with one of JSON.stringify(object) then Base64',
          },
          'x-nc-date': {
            type: 'string',
            description: 'Timestamp of current date time',
          },
          'x-nc-signature': {
            type: 'string',
            description:
              'Required fields: algorithm, headers, signature. Algorithm only support HmacSHA256, headers: all header need to sign seperated by space, signature: HMAC SHA-256 of headers value seperated by "\n" in base64 format.',
          },
          'x-nc-digest': {
            type: 'string',
            description:
              'HMAC SHA-256 of the body content in base64 format, use JSON.stringify to convert body to string, add "SHA-256=" at the beginning',
          },
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
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ApiAppBuilderController_removeApps',
      description: 'Remove applications',
      parameters: {
        type: 'object',
        properties: {
          'x-nc-lang': {
            type: 'string',
            description: 'current user language',
            enum: ['en', 'vi'],
            default: 'en',
          },
          'x-nc-tenant': {
            type: 'string',
            description: 'org tenant',
          },
          'x-nc-payload': {
            type: 'string',
            description: 'Payload with one of JSON.stringify(object) then Base64',
          },
          'x-nc-date': {
            type: 'string',
            description: 'Timestamp of current date time',
          },
          'x-nc-signature': {
            type: 'string',
            description:
              'Required fields: algorithm, headers, signature. Algorithm only support HmacSHA256, headers: all header need to sign seperated by space, signature: HMAC SHA-256 of headers value seperated by "\n" in base64 format.',
          },
          'x-nc-digest': {
            type: 'string',
            description:
              'HMAC SHA-256 of the body content in base64 format, use JSON.stringify to convert body to string, add "SHA-256=" at the beginning',
          },
          names: {
            type: 'array',
            items: {
              type: 'string',
              description: '',
            },
            description: '',
          },
        },
        required: ['names'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ApiAppBuilderController_updateAppLayouts',
      description: 'Order app pages',
      parameters: {
        type: 'object',
        properties: {
          'x-nc-lang': {
            type: 'string',
            description: 'current user language',
            enum: ['en', 'vi'],
            default: 'en',
          },
          'x-nc-tenant': {
            type: 'string',
            description: 'org tenant',
          },
          'x-nc-payload': {
            type: 'string',
            description: 'Payload with one of JSON.stringify(object) then Base64',
          },
          'x-nc-date': {
            type: 'string',
            description: 'Timestamp of current date time',
          },
          'x-nc-signature': {
            type: 'string',
            description:
              'Required fields: algorithm, headers, signature. Algorithm only support HmacSHA256, headers: all header need to sign seperated by space, signature: HMAC SHA-256 of headers value seperated by "\n" in base64 format.',
          },
          'x-nc-digest': {
            type: 'string',
            description:
              'HMAC SHA-256 of the body content in base64 format, use JSON.stringify to convert body to string, add "SHA-256=" at the beginning',
          },
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
  },
];
