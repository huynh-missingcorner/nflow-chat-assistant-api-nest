import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const apiObjectFormatSchema = z.object({
  data: z.object({
    displayName: z.string().describe('Display name of the object'),
    recordName: z.object({
      label: z.string().describe('Label for record name (same as displayName)'),
      type: z.enum(['text']).describe('Type of record name'),
    }),
    owd: z
      .enum(['PublicRead', 'PublicReadWrite', 'Private'])
      .describe('Access level')
      .default('Private'),
    name: z.string().describe('Technical object name'),
    description: z.string().nullable().optional().describe('Object description'),
  }),
  action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
  name: z.string().describe('Object name for the action'),
});

const apiFieldFormatSchema = z.object({
  objName: z.string().describe('Object name where field belongs'),
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
      .describe('Nflow data type'),
    name: z.string().describe('Technical field name'),
    displayName: z.string().describe('User-friendly field name'),
    attributes: z
      .object({
        subType: z
          .enum([
            'short',
            'long',
            'rich', // text subtypes
            'integer',
            'float', // numeric subtypes
            'date-time',
            'date',
            'time', // dateTime subtypes
            'single',
            'multiple', // pickList subtypes
          ])
          .optional()
          .describe('Field subtype'),
        onDelete: z.string().optional().describe('On delete action for relations'),
        filters: z.array(z.unknown()).optional().describe('Filters for relation fields'),
      })
      .optional(),
    description: z.string().nullable().optional().describe('Field description'),
    pickListId: z.string().nullable().optional().describe('Pick list ID for pickList fields'),
    value: z.string().nullable().optional().describe('Target object name for relation fields'),
  }),
  action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
});

const apiFormatParserSchema = z.object({
  objectFormat: apiObjectFormatSchema.describe('Parsed object in API format'),
  fieldsFormat: z.array(apiFieldFormatSchema).describe('Parsed fields in API format'),
  parsingNotes: z.array(z.string()).optional().describe('Notes about the parsing process'),
});

type ApiFormatParserInput = z.infer<typeof apiFormatParserSchema>;

const apiFormatParserHandler = async (input: ApiFormatParserInput): Promise<string> => {
  return new Promise((resolve) => {
    console.log('apiFormatParserHandler', input);
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

export const apiFormatParserTool = tool(apiFormatParserHandler, {
  name: 'ApiFormatParserTool',
  description: 'Parses Nflow schema into exact API format for changeObject and changeField tools',
  schema: apiFormatParserSchema,
});

export type { ApiFormatParserInput };
