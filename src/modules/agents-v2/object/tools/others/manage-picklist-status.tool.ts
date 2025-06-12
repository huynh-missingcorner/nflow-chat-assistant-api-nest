import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const managePickListStatusSchema = z.object({
  name: z.string().describe('Name of the picklist to activate or deactivate'),
  action: z.enum(['activate', 'deactivate']).describe('Action to perform on the picklist'),
});

type ManagePickListStatusInput = z.infer<typeof managePickListStatusSchema>;

const managePickListStatusHandler = async (
  input: ManagePickListStatusInput,
): Promise<ManagePickListStatusInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const managePickListStatusTool = tool(managePickListStatusHandler, {
  name: 'PickListController_managePickListStatus',
  description: 'Activate or deactivate a picklist',
  schema: managePickListStatusSchema,
});
