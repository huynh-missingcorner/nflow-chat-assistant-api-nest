import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import {
  NFLOW_DATA_TYPES,
  NFLOW_SUBTYPES,
  OBJECT_GRAPH_CONFIG,
  RELATIONSHIP_TYPES,
} from '../constants/object-graph.constants';

const nflowFieldSchema = z.object({
  name: z.string().describe('Technical field name (camelCase or snake_case)'),
  displayName: z.string().describe('User-friendly field name'),
  typeName: z
    .enum([
      NFLOW_DATA_TYPES.NUMERIC,
      NFLOW_DATA_TYPES.TEXT,
      NFLOW_DATA_TYPES.DATE_TIME,
      NFLOW_DATA_TYPES.BOOLEAN,
      NFLOW_DATA_TYPES.PICK_LIST,
      NFLOW_DATA_TYPES.JSON,
      NFLOW_DATA_TYPES.GENERATED,
      NFLOW_DATA_TYPES.CURRENCY,
      NFLOW_DATA_TYPES.EXTERNAL_RELATION,
      NFLOW_DATA_TYPES.RELATION,
      NFLOW_DATA_TYPES.OBJECT_REFERENCE,
      NFLOW_DATA_TYPES.FLOW_REFERENCE,
      NFLOW_DATA_TYPES.ROLLUP,
      NFLOW_DATA_TYPES.FILE,
    ])
    .describe('Nflow data type'),
  required: z.boolean().describe('Whether the field is required'),
  subType: z
    .enum([
      NFLOW_SUBTYPES.TEXT.SHORT,
      NFLOW_SUBTYPES.TEXT.LONG,
      NFLOW_SUBTYPES.TEXT.RICH, // for text
      NFLOW_SUBTYPES.NUMERIC.INTEGER,
      NFLOW_SUBTYPES.NUMERIC.FLOAT, // for numeric
      NFLOW_SUBTYPES.DATE_TIME.DATE_TIME,
      NFLOW_SUBTYPES.DATE_TIME.DATE,
      NFLOW_SUBTYPES.DATE_TIME.TIME, // for dateTime
      NFLOW_SUBTYPES.PICK_LIST.SINGLE,
      NFLOW_SUBTYPES.PICK_LIST.MULTIPLE, // for pickList
    ])
    .optional()
    .describe('Subtype for the field (context-dependent)'),
  description: z.string().optional().describe('Field description'),
  targetObject: z.string().optional().describe('Target object name for relation fields'),
  pickListOptions: z.array(z.string()).optional().describe('Options for pickList fields'),
  defaultValue: z.string().optional().describe('Default value for the field'),
});

const nflowObjectSchema = z.object({
  objectName: z.string().describe('Technical object name'),
  displayName: z.string().describe('User-friendly object name'),
  description: z.string().optional().describe('Object description'),
  fields: z.array(nflowFieldSchema).describe('Array of field definitions'),
  priority: z
    .number()
    .min(OBJECT_GRAPH_CONFIG.MIN_PRIORITY)
    .max(OBJECT_GRAPH_CONFIG.MAX_PRIORITY)
    .default(OBJECT_GRAPH_CONFIG.DEFAULT_SCHEMA_PRIORITY)
    .describe('Creation priority (1=highest, 10=lowest)'),
  dependencies: z
    .array(z.string())
    .optional()
    .describe('Objects that must be created before this one'),
});

const schemaRelationshipSchema = z.object({
  fromObject: z.string().describe('Source object name'),
  toObject: z.string().describe('Target object name'),
  relationshipType: z
    .enum([
      RELATIONSHIP_TYPES.ONE_TO_ONE,
      RELATIONSHIP_TYPES.ONE_TO_MANY,
      RELATIONSHIP_TYPES.MANY_TO_ONE,
      RELATIONSHIP_TYPES.MANY_TO_MANY,
    ])
    .describe('Type of relationship'),
  description: z.string().optional().describe('Relationship description'),
  fieldMapping: z
    .record(z.string())
    .optional()
    .describe('Field mapping between objects (from -> to)'),
});

const databaseSchemaDesignSchema = z.object({
  schemaName: z.string().describe('Database schema name'),
  description: z.string().optional().describe('Schema description'),
  objects: z.array(nflowObjectSchema).describe('Array of object definitions'),
  relationships: z
    .array(schemaRelationshipSchema)
    .optional()
    .describe('Inter-object relationships'),
  creationOrder: z.array(z.string()).describe('Recommended object creation order'),
  designNotes: z.array(z.string()).optional().describe('Design considerations and notes'),
  recommendations: z.array(z.string()).optional().describe('Best practice recommendations'),
});

type DatabaseSchemaDesignInput = z.infer<typeof databaseSchemaDesignSchema>;

const databaseSchemaDesignHandler = async (
  input: DatabaseSchemaDesignInput,
): Promise<DatabaseSchemaDesignInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const databaseSchemaDesignTool = tool(databaseSchemaDesignHandler, {
  name: 'DatabaseSchemaDesignTool',
  description: 'Designs complete database schemas with multiple objects and their relationships',
  schema: databaseSchemaDesignSchema,
});

export type { DatabaseSchemaDesignInput };
