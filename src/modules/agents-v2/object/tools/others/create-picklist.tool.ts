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

const createPickListSchema = z.object({
  name: z.string().describe('Unique name of the picklist'),
  displayName: z.string().describe('Display name of the picklist'),
  description: z.string().optional().describe('Description of the picklist'),
  items: z.array(mutatePickListItemSchema).optional().describe('Array of picklist items'),
  itemLabels: z.array(z.string()).optional().describe('Array of item labels'),
  viewAttributes: z.record(z.any()).optional().describe('View attributes for the picklist'),
  tagNames: z
    .array(z.string())
    .optional()
    .describe('Array of tag names to associate with the picklist'),
});

type CreatePickListInput = z.infer<typeof createPickListSchema>;

const createPickListHandler = async (input: CreatePickListInput): Promise<CreatePickListInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const createPickListTool = tool(createPickListHandler, {
  name: 'PickListController_createPickList',
  description: 'Create a new picklist with items and configuration',
  schema: createPickListSchema,
});
