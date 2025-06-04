import { createNewApplicationTool } from './create-new-application.tool';
import { removeApplicationsTool } from './remove-application.tool';
import { updateApplicationTool } from './update-application.tool';
import { updateApplicationLayoutsTool } from './update-application-layout.tool';

export const applicationManagementTools = [
  createNewApplicationTool,
  updateApplicationTool,
  updateApplicationLayoutsTool,
  removeApplicationsTool,
];

export const tools = [
  createNewApplicationTool,
  updateApplicationTool,
  updateApplicationLayoutsTool,
  removeApplicationsTool,
];

// Individual tool exports
export { appDesignTool, appValidationTool } from './app-design.tool';
export { appUnderstandingTool } from './app-understanding.tool';
export { createNewApplicationTool } from './create-new-application.tool';
export { removeApplicationsTool } from './remove-application.tool';
export { updateApplicationTool } from './update-application.tool';
export { updateApplicationLayoutsTool } from './update-application-layout.tool';
