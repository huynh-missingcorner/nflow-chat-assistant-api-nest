import { tool } from '@langchain/core/tools';
import z from 'zod';

const createNewApplicationSchema = z.object({
  name: z
    .string()
    .describe('Name of the application, should be unique and generated from the displayName'),
  displayName: z.string().describe('Display name of the application'),
  description: z.string().nullable().describe('Description of the application'),
  profiles: z
    .array(z.string().describe('Profile name'))
    .nullable()
    .describe('Profiles that the application will use'),
  tagNames: z
    .array(z.string().describe('Tag name'))
    .nullable()
    .describe('Tag names that the application will use'),
  credentials: z
    .array(z.string().describe('Credential name'))
    .nullable()
    .describe('Credentials that the application will use'),
});

type CreateNewApplicationInput = z.infer<typeof createNewApplicationSchema>;

const createNewApplicationHandler = async (
  input: CreateNewApplicationInput,
): Promise<CreateNewApplicationInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const createNewApplicationTool = tool(createNewApplicationHandler, {
  name: 'ApiAppBuilderController_createApp',
  description: 'Create new application',
  schema: createNewApplicationSchema,
});
