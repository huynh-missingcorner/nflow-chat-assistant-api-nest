import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const typeMappingSchema = z.object({
  fieldName: z.string().describe('The name of the field'),
  typeHint: z.string().describe('The inferred type from user language'),
  required: z.boolean().default(false).describe('Whether the field is required'),
  defaultValue: z.unknown().optional().describe('Default value for the field'),
});

type TypeMappingInput = z.infer<typeof typeMappingSchema>;

const typeMappingHandler = async (input: TypeMappingInput): Promise<string> => {
  return new Promise((resolve) => {
    console.log('typeMappingHandler', input);
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

export const typeMappingTool = tool(typeMappingHandler, {
  name: 'TypeMappingTool',
  description: 'Maps user-inferred type hints to Nflow-compatible data types',
  schema: typeMappingSchema,
});
