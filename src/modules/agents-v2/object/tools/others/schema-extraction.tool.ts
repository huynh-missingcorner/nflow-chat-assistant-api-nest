import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { RELATIONSHIP_TYPES } from '@/modules/agents-v2/object/constants/object-graph.constants';

const fieldSpecSchema = z.object({
  name: z.string().describe('Field name'),
  typeHint: z.string().describe('Type hint (e.g., string, number, boolean, date, etc.)'),
  required: z.boolean().default(false).describe('Whether the field is required'),
  description: z.string().optional().describe('Field description'),
  defaultValue: z.any().optional().describe('Default value for the field'),
  metadata: z.record(z.any()).optional().describe('Additional field metadata'),
});

const objectSpecSchema = z.object({
  objectName: z.string().describe('Object name'),
  description: z.string().optional().describe('Object description'),
  fields: z.array(fieldSpecSchema).describe('Object fields'),
  relationships: z
    .array(
      z.object({
        type: z
          .enum([
            RELATIONSHIP_TYPES.ONE_TO_ONE,
            RELATIONSHIP_TYPES.ONE_TO_MANY,
            RELATIONSHIP_TYPES.MANY_TO_MANY,
          ])
          .describe('Relationship type'),
        targetObject: z.string().describe('Target object name'),
        description: z.string().optional().describe('Relationship description'),
      }),
    )
    .optional()
    .describe('Object relationships'),
  metadata: z.record(z.any()).optional().describe('Additional object metadata'),
});

const schemaExtractionSchema = z.object({
  schemaName: z.string().describe('Database schema name'),
  description: z.string().optional().describe('Schema description'),
  objects: z.array(objectSpecSchema).describe('Extracted objects from the schema requirements'),
  globalRelationships: z
    .array(
      z.object({
        fromObject: z.string().describe('Source object name'),
        toObject: z.string().describe('Target object name'),
        type: z
          .enum([
            RELATIONSHIP_TYPES.ONE_TO_ONE,
            RELATIONSHIP_TYPES.ONE_TO_MANY,
            RELATIONSHIP_TYPES.MANY_TO_MANY,
          ])
          .describe('Relationship type'),
        description: z.string().optional().describe('Relationship description'),
        fieldMapping: z.record(z.string()).optional().describe('Field mapping between objects'),
      }),
    )
    .optional()
    .describe('Global relationships between objects'),
  businessRules: z
    .array(z.string())
    .optional()
    .describe('Business rules and constraints extracted from requirements'),
  metadata: z.record(z.any()).optional().describe('Additional schema metadata'),
});

type SchemaExtractionInput = z.infer<typeof schemaExtractionSchema>;

const schemaExtractionHandler = async (
  input: SchemaExtractionInput,
): Promise<SchemaExtractionInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const schemaExtractionTool = tool(schemaExtractionHandler, {
  name: 'SchemaExtractionTool',
  description:
    'Extracts database schema specifications with multiple objects and relationships from requirements',
  schema: schemaExtractionSchema,
});

export type { SchemaExtractionInput };
