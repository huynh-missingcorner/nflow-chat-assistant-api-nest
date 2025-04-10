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
            type: 'object',
            properties: {
              displayName: {
                type: 'string',
                description: '',
              },
              recordName: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                    description: '',
                  },
                  type: {
                    type: 'string',
                    description: '',
                    enum: ['text'],
                  },
                },
                required: [],
              },
              owd: {
                type: 'string',
                description: '',
                enum: ['PublicRead', 'PublicReadWrite', 'Private'],
              },
              tagNames: {
                type: 'array',
                items: {
                  type: 'string',
                  description: '',
                },
              },
              name: {
                type: 'string',
                description: '',
              },
              description: {
                type: 'string',
                description: '',
              },
            },
            required: ['displayName', 'recordName', 'name'],
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
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'FieldController_changeField',
      description: 'C/U/D field',
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
            type: 'object',
            properties: {
              typeName: {
                type: 'string',
                description: '',
                enum: [
                  'numeric',
                  'text',
                  'dateTime',
                  'boolean',
                  'pickList',
                  'json',
                  'generated',
                  'currency',
                  'externalRelation',
                  'relation',
                  'objectReference',
                  'flowReference',
                  'rollup',
                  'file',
                ],
              },
              isRequired: {
                type: 'boolean',
                description: '',
                default: false,
              },
              isExternalId: {
                type: 'boolean',
                description: '',
                default: false,
              },
              value: {
                type: 'string',
                description:
                  'value can be: \n\n    For relation/externalRelation: targetObjectName\n    For indirectRelation: targetObjectName.externalFieldName\n    For rollup: ChildObjectName.relationFieldName.rollupFieldName\n  ',
              },
              pickListName: {
                type: 'string',
                description: '',
              },
              name: {
                type: 'string',
                description: '',
              },
              displayName: {
                type: 'string',
                description: '',
              },
              attributes: {
                type: 'object',
                properties: {
                  filters: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          fieldName: {
                            type: 'string',
                            description: '',
                          },
                          operator: {
                            type: 'string',
                            description: '',
                            enum: [
                              '===',
                              '!==',
                              'isIn',
                              'isNotIn',
                              'notContains',
                              'contains',
                              'between',
                              '<=',
                              '>=',
                              '<',
                              '>',
                              'isNull',
                              'isNotNull',
                            ],
                          },
                          value: {
                            type: 'string',
                            description: '',
                          },
                        },
                        required: ['fieldName', 'operator'],
                      },
                    },
                  },
                  defaultValue: {
                    type: 'object',
                    properties: {},
                    required: [],
                  },
                  onDelete: {
                    type: 'string',
                    description: "Use with relation field. 'SET_NULL' requires 'isRequired'=false",
                    enum: ['noAction', 'setNull', 'cascade'],
                  },
                  sensitivity: {
                    type: 'string',
                    description:
                      "Currently applied for short text only. 'Partial' will only expose the last 4 characters. 'All' will hide everything & return '****'",
                    enum: ['none', 'partial', 'all'],
                  },
                  pickListLvl: {
                    type: 'number',
                    description: 'Levels of picklist items, only applicable for single selection',
                  },
                  subType: {
                    type: 'string',
                    description: '',
                  },
                  template: {
                    type: 'string',
                    description: '',
                  },
                  isUnique: {
                    type: 'boolean',
                    description: '',
                  },
                  isSearchable: {
                    type: 'boolean',
                    description: '',
                  },
                  isSortable: {
                    type: 'boolean',
                    description: '',
                  },
                  objectNames: {
                    type: 'array',
                    items: {
                      type: 'string',
                      description: '',
                    },
                  },
                  includeExtended: {
                    type: 'boolean',
                    description: '',
                  },
                  operation: {
                    type: 'string',
                    description: '',
                    enum: ['sum', 'count'],
                  },
                  fileSizeLimit: {
                    type: 'number',
                    description: '',
                  },
                  fileTypes: {
                    type: 'array',
                    items: {
                      type: 'string',
                      description: '',
                      enum: [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'text/plain',
                        'text/csv',
                        'text/markdown',
                        'image/jpeg',
                        'image/png',
                        'image/gif',
                        'video/mp4',
                        'audio/mpeg',
                        'video/quicktime',
                        'video/x-flv',
                        'video/x-matroska',
                        'audio/x-ms-wma',
                        'audio/m4a',
                        'video/x-m4v',
                      ],
                    },
                  },
                  numberFormat: {
                    type: 'object',
                    properties: {
                      precision: {
                        type: 'number',
                        description: '',
                      },
                      locale: {
                        type: 'string',
                        description: '',
                      },
                      separator: {
                        type: 'string',
                        description: '',
                      },
                      useShorthandNotation: {
                        type: 'boolean',
                        description: '',
                      },
                    },
                    required: [],
                  },
                  formatter: {
                    type: 'object',
                    description: '',
                  },
                },
                required: [],
              },
              pickListId: {
                type: 'string',
                description: '',
              },
              description: {
                type: 'string',
                description: '',
              },
            },
            required: ['typeName', 'name', 'displayName', 'attributes'],
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
