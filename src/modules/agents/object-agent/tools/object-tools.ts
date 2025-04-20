import { FunctionTool } from 'openai/resources/responses/responses.mjs';

export const createNewFieldTool: FunctionTool = {
  type: 'function',
  strict: true,
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
            type: ['object', 'null'],
            properties: {
              subType: {
                type: ['string', 'null'],
                description:
                  'Subtype of the field. If typeName is numeric, subtype is integer. If typeName is text, subtype is short. If typeName is dateTime, subtype is date-time',
                enum: ['integer', 'short', 'date-time'],
              },
            },
            required: ['subType'],
            additionalProperties: false,
          },
          description: {
            type: ['string', 'null'],
            description: 'Description of the field',
          },
        },
        required: ['typeName', 'name', 'displayName', 'attributes', 'description'],
        description: 'Data to create the field',
        additionalProperties: false,
      },
      action: {
        type: 'string',
        description: 'Action to perform',
        enum: ['create', 'update', 'delete', 'recover'],
      },
    },
    required: ['objName', 'action', 'data'],
    additionalProperties: false,
  },
};

export const createNewObjectTool: FunctionTool = {
  type: 'function',
  strict: true,
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
            description: 'Display name of the object',
          },
          recordName: {
            type: 'object',
            properties: {
              label: {
                type: 'string',
                description: 'Label of the record name. Always set to the same as the displayName',
              },
              type: {
                type: 'string',
                description: 'Type of the record name',
                enum: ['text'],
              },
            },
            required: ['label', 'type'],
            additionalProperties: false,
          },
          owd: {
            type: ['string', 'null'],
            description: 'Access level of the object',
            enum: ['PublicRead', 'PublicReadWrite', 'Private'],
            default: 'Private',
          },
          name: {
            type: 'string',
            description: 'Name of the object',
          },
          description: {
            type: ['string', 'null'],
            description: 'Description of the object',
          },
        },
        required: ['displayName', 'recordName', 'name', 'description', 'owd'],
        description: 'Data to create the object',
        additionalProperties: false,
      },
      action: {
        type: 'string',
        description: 'Action to perform',
        enum: ['create', 'update', 'delete', 'recover'],
      },
      name: {
        type: ['string', 'null'],
        description: 'Name of the object',
      },
    },
    required: ['action', 'data', 'name'],
    additionalProperties: false,
  },
};

export const schemaDesignerTool: FunctionTool = {
  type: 'function',
  strict: true,
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
                },
                required: ['name', 'type', 'displayName', 'description', 'required'],
                additionalProperties: false,
              },
            },
            relationships: {
              type: ['array', 'null'],
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
                additionalProperties: false,
              },
            },
          },
          required: [
            'name',
            'displayName',
            'description',
            'primaryField',
            'fields',
            'relationships',
          ],
          additionalProperties: false,
        },
      },
    },
    required: ['schemas'],
    additionalProperties: false,
  },
};
