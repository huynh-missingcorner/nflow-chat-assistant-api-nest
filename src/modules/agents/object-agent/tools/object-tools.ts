import { ChatCompletionTool } from 'openai/resources/index.mjs';

export const createNewFieldTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'FieldController_changeField',
    description: 'Create new Field in Object',
    parameters: {
      type: 'object',
      properties: {
        objName: {
          type: 'string',
          description: 'Object name',
        },
        data: {
          type: 'object',
          properties: {
            typeName: {
              type: 'string',
              description: 'Type of the field',
              enum: ['numeric', 'text', 'dateTime', 'boolean'],
            },
            name: {
              type: 'string',
              description: 'Name of the field',
            },
            displayName: {
              type: 'string',
              description: 'Display name of the field',
            },
            attributes: {
              type: 'object',
              properties: {
                subType: {
                  type: 'string',
                  description:
                    'Subtype of the field. If typeName is numeric, subtype is integer. If typeName is text, subtype is short. If typeName is dateTime, subtype is date-time',
                  enum: ['integer', 'short', 'date-time'],
                },
              },
              required: [],
            },
            description: {
              type: 'string',
              description: 'Description of the field',
            },
          },
          required: ['typeName', 'name', 'displayName', 'attributes'],
          description: 'Data to create the field',
        },
        action: {
          type: 'string',
          description: 'Action to perform',
          enum: ['create', 'update', 'delete', 'recover'],
        },
      },
      required: ['objName', 'action'],
    },
  },
};

export const createNewObjectTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'ObjectController_changeObject',
    description: 'Create new Object',
    parameters: {
      type: 'object',
      properties: {
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
};

export const schemaDesignerTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'SchemaDesigner_designSchema',
    description: 'Design database schemas for objects following best practices',
    parameters: {
      type: 'object',
      properties: {
        schemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The name of the object',
              },
              displayName: {
                type: 'string',
                description: 'User-friendly display name',
              },
              description: {
                type: 'string',
                description: 'Detailed description of the object purpose',
              },
              primaryField: {
                type: 'string',
                description: 'The main identifier field for this object',
              },
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Field name in camelCase',
                    },
                    type: {
                      type: 'string',
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
                      description: 'Field type',
                    },
                    displayName: {
                      type: 'string',
                      description: 'User-friendly display name for the field',
                    },
                    description: {
                      type: 'string',
                      description: 'Detailed description of the field purpose',
                    },
                    required: {
                      type: 'boolean',
                      description: 'Whether this field is required',
                    },
                    searchable: {
                      type: 'boolean',
                      description: 'Whether this field should be searchable',
                    },
                    attributes: {
                      type: 'object',
                      properties: {
                        isUnique: {
                          type: 'boolean',
                          description: 'Whether this field should have unique values',
                        },
                        defaultValue: {
                          type: 'string',
                          description: 'Default value for the field',
                        },
                        validation: {
                          type: 'object',
                          description: 'Validation rules for the field',
                        },
                      },
                    },
                  },
                  required: [
                    'name',
                    'type',
                    'displayName',
                    'description',
                    'required',
                    'searchable',
                  ],
                },
              },
              relationships: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany'],
                      description: 'Type of relationship',
                    },
                    targetObject: {
                      type: 'string',
                      description: 'Name of the related object',
                    },
                    fieldName: {
                      type: 'string',
                      description: 'Name of the field that represents this relationship',
                    },
                    description: {
                      type: 'string',
                      description: 'Description of the relationship',
                    },
                  },
                  required: ['type', 'targetObject', 'fieldName', 'description'],
                },
              },
            },
            required: ['name', 'displayName', 'description', 'primaryField', 'fields'],
          },
        },
      },
      required: ['schemas'],
    },
  },
};
