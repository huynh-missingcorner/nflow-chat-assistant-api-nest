import { tool } from '@langchain/core/tools';
import z from 'zod';

const updateApplicationSchema = z.object({
  name: z.string().describe('Name of the application'),
  displayName: z.string().describe('Display name of the application'),
  description: z.string().describe('Description of the application'),
  profiles: z
    .array(z.string().describe('Profile name'))
    .describe('Profiles that the application will use'),
  credentials: z
    .array(z.string().describe('Credential name'))
    .describe('Credentials that the application will use'),
  customProps: z.string().optional().describe('Base64 custom properties'),
});

type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

const updateApplicationHandler = async (input: UpdateApplicationInput): Promise<string> => {
  return new Promise((resolve) => {
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

export const updateApplicationTool = tool(updateApplicationHandler, {
  name: 'ApiAppBuilderController_updateApp',
  description: 'Update application',
  schema: updateApplicationSchema,
});
