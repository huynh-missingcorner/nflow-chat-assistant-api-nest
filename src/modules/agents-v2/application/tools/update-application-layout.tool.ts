import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const updateApplicationLayoutsSchema = z.object({
  name: z.string().describe('Application name'),
  layoutIds: z.array(z.string()).describe('Layout IDs to order'),
});

type UpdateApplicationLayoutsInput = z.infer<typeof updateApplicationLayoutsSchema>;

const updateApplicationLayoutsHandler = async (
  input: UpdateApplicationLayoutsInput,
): Promise<UpdateApplicationLayoutsInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const updateApplicationLayoutsTool = tool(updateApplicationLayoutsHandler, {
  name: 'ApiAppBuilderController_updateAppLayouts',
  description: 'Order app pages',
  schema: updateApplicationLayoutsSchema,
});
