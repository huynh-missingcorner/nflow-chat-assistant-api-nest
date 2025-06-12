import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const getPickListSchema = z.object({
  name: z.string().describe('Name of the picklist to retrieve'),
});

type GetPickListInput = z.infer<typeof getPickListSchema>;

const getPickListHandler = async (input: GetPickListInput): Promise<GetPickListInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const getPickListTool = tool(getPickListHandler, {
  name: 'PickListController_getPickList',
  description: 'Get a specific picklist by name',
  schema: getPickListSchema,
});
