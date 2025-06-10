import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const fieldExtractionSchema = z.object({
  name: z.string().describe('The name of the field extracted from the user message'),
  typeHint: z
    .string()
    .describe('The inferred type from user language (text, number, json, boolean, etc.)'),
  required: z.boolean().default(false).describe('Whether the field is required'),
  description: z.string().optional().describe('Description of the field'),
  defaultValue: z.unknown().optional().describe('Default value for the field if any'),
  metadata: z.record(z.unknown()).optional().describe('Additional metadata about the field'),
  action: z
    .enum(['create', 'update', 'delete', 'recover'])
    .default('create')
    .describe('The action to perform on the field (create, update, delete, or recover)'),
  objectName: z
    .string()
    .optional()
    .describe(
      'The unique name of the object where this field belongs (should match the unique name from created objects)',
    ),
});

type FieldExtractionInput = z.infer<typeof fieldExtractionSchema>;

const fieldExtractionHandler = async (
  input: FieldExtractionInput,
): Promise<FieldExtractionInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const fieldExtractionTool = tool(fieldExtractionHandler, {
  name: 'FieldExtractionTool',
  description:
    'Extracts field specification from natural language input including name, type, action, and target object',
  schema: fieldExtractionSchema,
});
