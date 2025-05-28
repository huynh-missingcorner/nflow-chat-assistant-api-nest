import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Tool for creating a new application
 */
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

const createNewApplicationHandler = async (input: CreateNewApplicationInput): Promise<string> => {
  return new Promise((resolve) => {
    console.log('createNewApplicationHandler', input);
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

const createNewApplicationTool = tool(createNewApplicationHandler, {
  name: 'ApiAppBuilderController_createApp',
  description: 'Create new application',
  schema: createNewApplicationSchema,
});

/**
 * Tool for updating an existing application
 */
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

const updateApplicationTool = tool(updateApplicationHandler, {
  name: 'ApiAppBuilderController_updateApp',
  description: 'Update application',
  schema: updateApplicationSchema,
});

/**
 * Tool for ordering application layouts
 */
const updateApplicationLayoutsSchema = z.object({
  name: z.string().describe('Application name'),
  layoutIds: z.array(z.string()).describe('Layout IDs to order'),
});

type UpdateApplicationLayoutsInput = z.infer<typeof updateApplicationLayoutsSchema>;

const updateApplicationLayoutsHandler = async (
  input: UpdateApplicationLayoutsInput,
): Promise<string> => {
  return new Promise((resolve) => {
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

const updateApplicationLayoutsTool = tool(updateApplicationLayoutsHandler, {
  name: 'ApiAppBuilderController_updateAppLayouts',
  description: 'Order app pages',
  schema: updateApplicationLayoutsSchema,
});

/**
 * Tool for removing applications
 */
const removeApplicationsSchema = z.object({
  names: z.array(z.string()).describe('Names of applications to remove'),
});

type RemoveApplicationsInput = z.infer<typeof removeApplicationsSchema>;

const removeApplicationsHandler = async (input: RemoveApplicationsInput): Promise<string> => {
  return new Promise((resolve) => {
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

const removeApplicationsTool = tool(removeApplicationsHandler, {
  name: 'ApiAppBuilderController_removeApps',
  description: 'Remove applications',
  schema: removeApplicationsSchema,
});

export const tools = [
  createNewApplicationTool,
  updateApplicationTool,
  updateApplicationLayoutsTool,
  removeApplicationsTool,
];
