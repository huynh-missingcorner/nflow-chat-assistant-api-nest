import { changeFieldTool } from './fields/change-field.tool';
import { fieldExistenceTool } from './fields/field-existence.tool';
import { fieldExtractionTool } from './fields/field-extraction.tool';
import { pickListAnalysisTool } from './fields/picklist-analysis.tool';
import { changeObjectTool } from './object/change-object.tool';
import { objectExtractionTool } from './object/object-extraction.tool';
import { apiFormatParserTool } from './others/api-format-parser.tool';
import { createPickListTool } from './others/create-picklist.tool';
import { databaseSchemaDesignTool } from './others/database-schema-design.tool';
import { getPickListTool } from './others/get-picklist.tool';
import { getPickListAuditLogsTool } from './others/get-picklist-audit-logs.tool';
import { managePickListLifecycleTool } from './others/manage-picklist-lifecycle.tool';
import { managePickListStatusTool } from './others/manage-picklist-status.tool';
import { nflowSchemaDesignTool } from './others/nflow-schema-design.tool';
import { schemaExtractionTool } from './others/schema-extraction.tool';
import { searchPickListsTool } from './others/search-picklists.tool';
import { updatePickListTool } from './others/update-picklist.tool';

// Export all tools as a convenient array
export const allObjectTools = [
  apiFormatParserTool,
  changeFieldTool,
  changeObjectTool,
  createPickListTool,
  databaseSchemaDesignTool,
  fieldExistenceTool,
  fieldExtractionTool,
  getPickListTool,
  getPickListAuditLogsTool,
  managePickListLifecycleTool,
  managePickListStatusTool,
  nflowSchemaDesignTool,
  objectExtractionTool,
  pickListAnalysisTool,
  schemaExtractionTool,
  searchPickListsTool,
  updatePickListTool,
];

// Export individual tools for specific node usage
export {
  apiFormatParserTool,
  changeFieldTool,
  changeObjectTool,
  createPickListTool,
  databaseSchemaDesignTool,
  fieldExistenceTool,
  fieldExtractionTool,
  getPickListAuditLogsTool,
  getPickListTool,
  managePickListLifecycleTool,
  managePickListStatusTool,
  nflowSchemaDesignTool,
  objectExtractionTool,
  pickListAnalysisTool,
  schemaExtractionTool,
  searchPickListsTool,
  updatePickListTool,
};
