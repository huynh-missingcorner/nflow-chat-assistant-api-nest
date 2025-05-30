import { tool } from '@langchain/core/tools';
import { z } from 'zod';

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

export const changeObjectTool = tool(changeObjectHandler, {
  name: 'ObjectController_changeObject',
  description: 'Create/Update/Delete Object',
  schema: changeObjectSchema,
});
