import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const managePickListLifecycleSchema = z.object({
  names: z.array(z.string()).min(1).describe('Array of picklist names to remove or recover'),
  action: z
    .enum(['remove', 'recover'])
    .describe('Action to perform: remove (soft delete) or recover (restore)'),
});

type ManagePickListLifecycleInput = z.infer<typeof managePickListLifecycleSchema>;

const managePickListLifecycleHandler = async (
  input: ManagePickListLifecycleInput,
): Promise<ManagePickListLifecycleInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const managePickListLifecycleTool = tool(managePickListLifecycleHandler, {
  name: 'PickListController_managePickListLifecycle',
  description: 'Remove (soft delete) or recover (restore) multiple picklists',
  schema: managePickListLifecycleSchema,
});
