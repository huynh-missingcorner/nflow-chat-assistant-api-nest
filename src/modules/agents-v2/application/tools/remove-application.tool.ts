import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const removeApplicationsSchema = z.object({
  names: z.array(z.string()).describe('Names of applications to remove'),
});

type RemoveApplicationsInput = z.infer<typeof removeApplicationsSchema>;

const removeApplicationsHandler = async (
  input: RemoveApplicationsInput,
): Promise<RemoveApplicationsInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const removeApplicationsTool = tool(removeApplicationsHandler, {
  name: 'ApiAppBuilderController_removeApps',
  description: 'Remove applications',
  schema: removeApplicationsSchema,
});
