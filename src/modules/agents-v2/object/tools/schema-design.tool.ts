import { tool } from '@langchain/core/tools';
import z from 'zod';

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

export const schemaDesignerTool = tool(schemaDesignerHandler, {
  name: 'SchemaDesigner_designSchema',
  description: 'Design database schemas for objects following best practices',
  schema: schemaDesignerSchema,
});
