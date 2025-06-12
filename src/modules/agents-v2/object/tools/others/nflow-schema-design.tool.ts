import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const nflowFieldSchema = z.object({
  name: z.string().describe('Technical field name (camelCase or snake_case)'),
  displayName: z.string().describe('User-friendly field name'),
  typeName: z
    .enum([
      'numeric',
      'text',
      'dateTime',
      'boolean',
      'pickList',
      'json',
      'generated',
      'currency',
      'externalRelation',
      'relation',
      'objectReference',
      'flowReference',
      'rollup',
      'file',
    ])
    .describe('Nflow data type'),
  required: z.boolean().describe('Whether the field is required'),
  subType: z
    .enum([
      'short',
      'long',
      'rich', // for text
      'integer',
      'float', // for numeric
      'date-time',
      'date',
      'time', // for dateTime
      'single',
      'multiple', // for pickList
    ])
    .optional()
    .describe('Subtype for the field (context-dependent)'),
  description: z.string().optional().describe('Field description'),
  targetObject: z.string().optional().describe('Target object name for relation fields'),
  pickListOptions: z.array(z.string()).optional().describe('Options for pickList fields'),
  defaultValue: z.string().optional().describe('Default value for the field'),
});

const nflowSchemaDesignSchema = z.object({
  objectName: z.string().describe('Technical object name'),
  displayName: z.string().describe('User-friendly object name'),
  description: z.string().optional().describe('Object description'),
  fields: z.array(nflowFieldSchema).describe('Array of field definitions'),
  designNotes: z.array(z.string()).optional().describe('Design considerations and notes'),
  recommendations: z.array(z.string()).optional().describe('Best practice recommendations'),
});

type NflowSchemaDesignInput = z.infer<typeof nflowSchemaDesignSchema>;

const nflowSchemaDesignHandler = async (
  input: NflowSchemaDesignInput,
): Promise<NflowSchemaDesignInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const nflowSchemaDesignTool = tool(nflowSchemaDesignHandler, {
  name: 'NflowSchemaDesignTool',
  description: 'Designs object schemas directly using Nflow platform data types',
  schema: nflowSchemaDesignSchema,
});

export type { NflowSchemaDesignInput };
