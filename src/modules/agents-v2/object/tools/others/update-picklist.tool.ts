import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const mutatePickListItemSchema = z.object({
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'RESTORE']).optional(),
  name: z.string().describe('Name of the picklist item'),
  displayName: z.string().optional().describe('Display name of the picklist item'),
  parentName: z.string().optional().describe('Parent name for hierarchical picklist items'),
  attributes: z.record(z.any()).optional().describe('Additional attributes for the picklist item'),
  order: z.number().optional().describe('Order of the picklist item'),
});

const updatePickListSchema = z.object({
  name: z.string().describe('Name of the picklist to update'),
  data: z.object({
    displayName: z.string().optional().describe('Updated display name of the picklist'),
    description: z.string().optional().describe('Updated description of the picklist'),
    itemLabels: z.array(z.string()).optional().describe('Updated array of item labels'),
    items: z
      .array(mutatePickListItemSchema)
      .optional()
      .describe('Array of picklist items to mutate'),
    viewAttributes: z
      .record(z.any())
      .optional()
      .describe('Updated view attributes for the picklist'),
    tagNames: z.array(z.string()).optional().describe('Updated array of tag names'),
  }),
});

type UpdatePickListInput = z.infer<typeof updatePickListSchema>;

const updatePickListHandler = async (input: UpdatePickListInput): Promise<UpdatePickListInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const updatePickListTool = tool(updatePickListHandler, {
  name: 'PickListController_updatePickList',
  description: 'Update an existing picklist with new data',
  schema: updatePickListSchema,
});
