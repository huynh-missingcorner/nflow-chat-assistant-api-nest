import { tool } from '@langchain/core/tools';
import { z } from 'zod';

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

export const changeFieldTool = tool(changeFieldHandler, {
  name: 'FieldController_changeField',
  description: 'Create/Update/Delete Field in Object',
  schema: changeFieldSchema,
});
