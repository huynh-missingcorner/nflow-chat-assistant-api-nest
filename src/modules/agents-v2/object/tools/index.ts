import { apiFormatParserTool } from './api-format-parser.tool';
import { changeFieldTool } from './change-field.tool';
import { changeObjectTool } from './change-object.tool';
import { databaseSchemaDesignTool } from './database-schema-design.tool';
import { fieldExistenceTool } from './field-existence.tool';
import { nflowSchemaDesignTool } from './nflow-schema-design.tool';
import { objectExtractionTool } from './object-extraction.tool';
import { schemaExtractionTool } from './schema-extraction.tool';

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
