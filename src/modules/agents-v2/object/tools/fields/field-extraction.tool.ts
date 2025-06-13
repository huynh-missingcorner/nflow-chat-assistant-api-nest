import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Schema for pickList item information
const pickListItemSchema = z.object({
  name: z.string().describe('Technical name of the pickList item'),
  displayName: z.string().describe('Display name of the pickList item'),
  order: z.number().optional().describe('Order of the item in the list'),
  action: z
    .enum(['CREATE', 'UPDATE', 'DELETE', 'RESTORE'])
    .default('CREATE')
    .describe('Action to perform on the pickList item'),
});

// Schema for pickList information
const pickListInfoSchema = z.object({
  needsNewPickList: z
    .boolean()
    .describe('Whether a new pickList needs to be created for this field'),
  pickListName: z
    .string()
    .optional()
    .describe('The name for the new pickList if one needs to be created'),
  pickListDisplayName: z.string().optional().describe('The display name for the new pickList'),
  pickListDescription: z.string().optional().describe('Description for the new pickList'),
  pickListItems: z
    .array(pickListItemSchema)
    .optional()
    .describe('Items to include in the new pickList'),
  existingPickListId: z
    .string()
    .optional()
    .describe('ID of an existing pickList to use (if not creating new)'),
  createdPickListId: z
    .string()
    .optional()
    .describe('ID of the created pickList (stored after successful creation)'),
});

const fieldExtractionSchema = z.object({
  name: z.string().describe('The name of the field extracted from the user message'),
  typeHint: z
    .string()
    .describe('The inferred type from user language (text, number, json, boolean, pickList, etc.)'),
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
  // PickList-specific properties
  pickListInfo: pickListInfoSchema
    .optional()
    .describe('Information needed for pickList field creation'),
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
    'Extracts field specification from natural language input including name, type, action, target object, and pickList information for pickList fields',
  schema: fieldExtractionSchema,
});
