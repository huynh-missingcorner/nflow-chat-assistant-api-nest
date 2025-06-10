import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Filter item schema matching the FieldDto interface
const filterItemSchema = z.object({
  fieldName: z.string(),
  operator: z.enum([
    '===',
    '!==',
    'isIn',
    'isNotIn',
    'notContains',
    'contains',
    'between',
    '<=',
    '>=',
    '<',
    '>',
    'isNull',
    'isNotNull',
  ]),
  value: z.string().optional(),
});

// Layout component schema
const layoutComponentSchema = z.object({
  layoutId: z.string(),
  componentIds: z.array(z.string()),
});

// Field attributes schema matching FieldAttributesDto
const fieldAttributesSchema = z
  .object({
    filters: z.array(z.array(filterItemSchema)).optional(),
    defaultValue: z.record(z.any()).optional(),
    onDelete: z.enum(['noAction', 'setNull', 'cascade']).optional(),
    sensitivity: z.enum(['none', 'partial', 'all']).optional(),
    subType: z.string().optional(),
  })
  .optional();

// Main schema matching FieldDto exactly
const changeFieldSchema = z.object({
  objName: z.string().describe('Object name where field belongs'),
  action: z
    .enum(['create', 'update', 'delete', 'recover'])
    .describe('Action to perform on the field'),
  name: z.string().optional().describe('Field name (required for delete operations)'),
  data: z.object({
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
      .describe('NFlow data type'),
    isRequired: z.boolean().optional().describe('Whether the field is required'),
    isExternalId: z.boolean().optional().describe('Whether the field is an external ID'),
    value: z.string().optional().describe('Target object name for relation fields'),
    pickListName: z.string().optional().describe('Pick list name for pickList fields'),
    name: z.string().describe('Technical field name'),
    displayName: z.string().describe('User-friendly field name'),
    attributes: fieldAttributesSchema.describe('Field attributes'),
    pickListId: z.string().optional().describe('Pick list ID for pickList fields'),
    description: z.string().optional().describe('Field description'),
  }),
  updateLayouts: z.array(layoutComponentSchema).optional().describe('Layout updates for the field'),
});

export type ChangeFieldInput = z.infer<typeof changeFieldSchema>;

const changeFieldHandler = async (input: ChangeFieldInput): Promise<ChangeFieldInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const changeFieldTool = tool(changeFieldHandler, {
  name: 'FieldController_changeField',
  description: 'Handles field operations (create, update, delete, recover) on existing objects',
  schema: changeFieldSchema,
});
