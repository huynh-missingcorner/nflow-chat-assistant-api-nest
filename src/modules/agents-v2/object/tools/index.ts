import { apiFormatParserTool } from './api-format-parser.tool';
import { changeFieldTool } from './change-field.tool';
import { changeObjectTool } from './change-object.tool';
import { fieldExistenceTool } from './field-existence.tool';
import { nflowSchemaDesignTool } from './nflow-schema-design.tool';
import { objectExtractionTool } from './object-extraction.tool';

// Export all tools as a convenient array
export const allObjectTools = [
  apiFormatParserTool,
  changeFieldTool,
  changeObjectTool,
  fieldExistenceTool,
  nflowSchemaDesignTool,
  objectExtractionTool,
];

// Export individual tools for specific node usage
export {
  apiFormatParserTool,
  changeFieldTool,
  changeObjectTool,
  fieldExistenceTool,
  nflowSchemaDesignTool,
  objectExtractionTool,
};
