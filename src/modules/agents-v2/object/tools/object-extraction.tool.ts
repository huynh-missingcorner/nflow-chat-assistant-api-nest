import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const fieldSpecSchema = z.object({
  name: z.string().describe('The name of the field'),
  typeHint: z.string().describe('The inferred type from user language'),
  required: z.boolean().default(false).describe('Whether the field is required'),
  description: z.string().optional().describe('Description of the field'),
  defaultValue: z.unknown().optional().describe('Default value for the field'),
  metadata: z.record(z.unknown()).optional().describe('Additional metadata about the field'),
});

const objectRelationshipSchema = z.object({
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']).describe('Type of relationship'),
  targetObject: z.string().describe('The target object name for the relationship'),
  description: z.string().optional().describe('Description of the relationship'),
});

const objectExtractionSchema = z.object({
  objectName: z.string().describe('The name of the object extracted from the user message'),
  description: z.string().optional().describe('Description of the object'),
  fields: z.array(fieldSpecSchema).optional().describe('Array of fields for the object'),
  relationships: z
    .array(objectRelationshipSchema)
    .optional()
    .describe('Array of relationships with other objects'),
  metadata: z.record(z.unknown()).optional().describe('Additional metadata about the object'),
});

type ObjectExtractionInput = z.infer<typeof objectExtractionSchema>;

const objectExtractionHandler = async (input: ObjectExtractionInput): Promise<string> => {
  return new Promise((resolve) => {
    console.log('objectExtractionHandler', input);
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

export const objectExtractionTool = tool(objectExtractionHandler, {
  name: 'ObjectExtractionTool',
  description:
    'Extracts complete object specification from natural language input including name, fields, and relationships',
  schema: objectExtractionSchema,
});
