import { createNewApplicationTool } from './create-new-application.tool';
import { removeApplicationsTool } from './remove-application.tool';
import { updateApplicationLayoutsTool } from './update-application-layout.tool';
import { updateApplicationTool } from './update-application.tool';

export const tools = [
  createNewApplicationTool,
  updateApplicationTool,
  updateApplicationLayoutsTool,
  removeApplicationsTool,
];
