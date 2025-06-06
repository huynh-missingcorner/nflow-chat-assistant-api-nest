import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const updateObjectSchema = z.object({
  action: z.enum(['create_object', 'add_fields']).describe('The action to perform'),
  objectId: z.string().optional().describe('The ID of the object (required for add_fields)'),
  objectName: z.string().optional().describe('The name of the object (required for create_object)'),
  description: z.string().optional().describe('Description of the object'),
  fields: z
    .array(
      z.object({
        name: z.string().describe('Field name'),
        type: z.string().describe('Field type'),
        required: z.boolean().optional().describe('Whether the field is required'),
        defaultValue: z.unknown().optional().describe('Default value for the field'),
        options: z.array(z.string()).optional().describe('Options for pick list fields'),
        validationRules: z.array(z.string()).optional().describe('Validation rules for the field'),
      }),
    )
    .describe('Array of fields to create or add'),
});

type UpdateObjectInput = z.infer<typeof updateObjectSchema>;

const updateObjectHandler = async (input: UpdateObjectInput): Promise<UpdateObjectInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const updateObjectTool = tool(updateObjectHandler, {
  name: 'UpdateObjectTool',
  description: 'Creates objects or adds fields to existing objects via Nflow API',
  schema: updateObjectSchema,
});
