import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Tool for changing fields in an object
 */
const changeFieldSchema = z.object({
  objName: z.string().describe('Object name'),
  data: z.object({
    typeName: z
      .enum(['numeric', 'text', 'dateTime', 'boolean', 'pickList', 'json', 'relation'])
      .describe('Type of the field'),
    name: z.string().describe('Name of the field'),
    displayName: z.string().describe('Display name of the field'),
    attributes: z
      .object({
        subType: z
          .enum([
            'short',
            'long',
            'rich',
            'integer',
            'float',
            'single',
            'multiple',
            'date-time',
            'date',
            'time',
          ])
          .nullable()
          .describe('Subtype of the field. Select this follow the Nflow data types instruction.'),
      })
      .nullable()
      .describe('Field attributes'),
    description: z.string().nullable().describe('Description of the field'),
    pickListId: z
      .string()
      .nullable()
      .describe('Pick list id for pickList type. Only use this when typeName is pickList.'),
    value: z
      .string()
      .nullable()
      .describe(
        'Name of the target object. Only use this when typeName is relation. If user mentions the target object name, use the name of the mentioned object.',
      ),
  }),
  action: z.enum(['create', 'update', 'delete', 'recover']).describe('Action to perform'),
});

type ChangeFieldInput = z.infer<typeof changeFieldSchema>;

const changeFieldHandler = async (input: ChangeFieldInput): Promise<string> => {
  return new Promise((resolve) => {
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

const changeFieldTool = tool(changeFieldHandler, {
  name: 'FieldController_changeField',
  description: 'Create/Update/Delete Field in Object',
  schema: changeFieldSchema,
});

/**
 * Tool for changing objects
 */
const changeObjectSchema = z.object({
  data: z.object({
    displayName: z.string().describe('Display name of the object'),
    recordName: z.object({
      label: z
        .string()
        .describe('Label of the record name. Always set to the same as the displayName'),
      type: z.enum(['text']).describe('Type of the record name'),
    }),
    owd: z
      .enum(['PublicRead', 'PublicReadWrite', 'Private'])
      .nullable()
      .describe('Access level of the object')
      .default('Private'),
    name: z.string().describe('Name of the object'),
    description: z.string().nullable().describe('Description of the object'),
  }),
  action: z.enum(['create', 'update', 'delete', 'recover']).describe('Action to perform'),
  name: z.string().nullable().describe('Name of the object'),
});

type ChangeObjectInput = z.infer<typeof changeObjectSchema>;

const changeObjectHandler = async (input: ChangeObjectInput): Promise<string> => {
  return new Promise((resolve) => {
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

const changeObjectTool = tool(changeObjectHandler, {
  name: 'ObjectController_changeObject',
  description: 'Create/Update/Delete Object',
  schema: changeObjectSchema,
});

/**
 * Tool for designing database schemas
 */
const schemaDesignerSchema = z.object({
  schemas: z.array(
    z.object({
      name: z.string().describe('The name of the object'),
      displayName: z.string().describe('User-friendly display name'),
      description: z.string().describe('Detailed description of the object purpose'),
      primaryField: z.string().describe('The main identifier field for this object'),
      fields: z.array(
        z.object({
          name: z.string().describe('Field name in camelCase'),
          type: z
            .enum([
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
            ])
            .describe('Field type'),
          displayName: z.string().describe('User-friendly display name for the field'),
          description: z.string().describe('Detailed description of the field purpose'),
          required: z.boolean().describe('Whether this field is required'),
        }),
      ),
      relationships: z
        .array(
          z.object({
            type: z
              .enum(['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany'])
              .describe('Type of relationship'),
            targetObject: z.string().describe('Name of the related object'),
            fieldName: z.string().describe('Name of the field that represents this relationship'),
            description: z.string().describe('Description of the relationship'),
          }),
        )
        .nullable(),
    }),
  ),
});

type SchemaDesignerInput = z.infer<typeof schemaDesignerSchema>;

const schemaDesignerHandler = async (input: SchemaDesignerInput): Promise<string> => {
  return new Promise((resolve) => {
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

const schemaDesignerTool = tool(schemaDesignerHandler, {
  name: 'SchemaDesigner_designSchema',
  description: 'Design database schemas for objects following best practices',
  schema: schemaDesignerSchema,
});

export const tools = [changeFieldTool, changeObjectTool, schemaDesignerTool];
