import { ChatCompletionTool } from 'openai/resources/index.mjs';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'ObjectController_changeObject',
      description: 'Create/Update/Delete/Recover Object',
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
          data: {
            description: 'Payload for the object actions',
            oneOf: [
              {
                title: 'ObjectCreateDto',
                type: 'object',
                description: 'Payload for the object create action',
                properties: {
                  displayName: {
                    type: 'string',
                    description: 'Display name of the object',
                  },
                  owd: {
                    type: 'string',
                    enum: ['PublicRead', 'PublicReadWrite', 'Private'],
                    description: 'Object write access',
                  },
                  tagNames: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Tag names of the object',
                  },
                  name: {
                    type: 'string',
                    description: 'Name of the object',
                    pattern: 'nameRegex',
                  },
                  description: {
                    type: 'string',
                    description: 'Description of the object',
                  },
                  recordName: {
                    type: 'object',
                    properties: {
                      label: {
                        type: 'string',
                        description: 'Name of the record',
                      },
                      type: {
                        type: 'string',
                        description: 'Type of the record',
                        enum: ['text'],
                      },
                    },
                    required: ['label', 'type'],
                  },
                },
                required: ['displayName', 'recordName', 'name'],
              },
              {
                title: 'ObjectUpdateDto',
                type: 'object',
                description: 'Payload for the object update action',
                properties: {
                  displayName: {
                    type: 'string',
                    description: 'Display name of the object',
                  },
                  owd: {
                    type: 'string',
                    enum: ['PublicRead', 'PublicReadWrite', 'Private'],
                    description: 'Object write access',
                  },
                  tagNames: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Tag names of the object',
                  },
                  description: {
                    type: 'string',
                    description: 'Description of the object',
                  },
                  recordName: {
                    type: 'object',
                    properties: {
                      label: {
                        type: 'string',
                        description: 'Name of the record',
                      },
                      type: {
                        type: 'string',
                        description: 'Type of the record',
                        enum: ['text'],
                      },
                    },
                    required: ['label', 'type'],
                  },
                },
              },
            ],
          },
          action: {
            type: 'string',
            description: 'Action to perform on the object',
            enum: ['create', 'update', 'delete', 'recover'],
          },
          name: {
            type: 'string',
            description: 'Name of the object',
          },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'FieldController_changeField',
      description: 'Create/Update/Delete/Recover Field',
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
          objName: {
            type: 'string',
            description: 'Object name',
          },
          data: {
            type: 'string',
            description: '',
          },
          updateLayouts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                layoutId: {
                  type: 'string',
                  description: '',
                },
                componentIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                    description: '',
                  },
                },
              },
              required: ['layoutId', 'componentIds'],
            },
            description: '',
          },
          action: {
            type: 'string',
            description: '',
            enum: ['create', 'update', 'delete', 'recover'],
          },
          name: {
            type: 'string',
            description: '',
          },
        },
        required: ['objName', 'action'],
      },
    },
  },
];
