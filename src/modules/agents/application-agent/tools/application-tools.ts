export const tools = [
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
        },
        required: [],
      },
      requestBody: {
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
          },
          tagNames: {
            type: 'array',
            items: {
              type: 'string',
              description: '',
            },
          },
          credentials: {
            type: 'array',
            items: {
              type: 'string',
              description: '',
            },
          },
        },
        required: ['name', 'displayName'],
      },
    },
  },
];
