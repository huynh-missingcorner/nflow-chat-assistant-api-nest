import { changeFieldTool } from './fields/change-field.tool';
import { fieldExistenceTool } from './fields/field-existence.tool';
import { changeObjectTool } from './object/change-object.tool';
import { objectExtractionTool } from './object/object-extraction.tool';
import { apiFormatParserTool } from './others/api-format-parser.tool';
import { databaseSchemaDesignTool } from './others/database-schema-design.tool';
import { nflowSchemaDesignTool } from './others/nflow-schema-design.tool';
import { schemaExtractionTool } from './others/schema-extraction.tool';

// Export all tools as a convenient array
export const allObjectTools = [
  apiFormatParserTool,
  changeFieldTool,
  changeObjectTool,
  databaseSchemaDesignTool,
  fieldExistenceTool,
  nflowSchemaDesignTool,
  objectExtractionTool,
  schemaExtractionTool,
];

// Export individual tools for specific node usage
export {
  apiFormatParserTool,
  changeFieldTool,
  changeObjectTool,
  databaseSchemaDesignTool,
  fieldExistenceTool,
  nflowSchemaDesignTool,
  objectExtractionTool,
  schemaExtractionTool,
};
