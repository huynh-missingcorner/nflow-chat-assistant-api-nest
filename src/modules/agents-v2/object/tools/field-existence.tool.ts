import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const fieldExistenceSchema = z.object({
  objectId: z.string().describe('The ID of the object to check'),
  fieldName: z.string().describe('The name of the field to check for existence'),
});

type FieldExistenceInput = z.infer<typeof fieldExistenceSchema>;

const fieldExistenceHandler = async (input: FieldExistenceInput): Promise<string> => {
  return new Promise((resolve) => {
    console.log('fieldExistenceHandler', input);
    resolve(JSON.stringify({ success: true, data: input }));
  });
};

export const fieldExistenceTool = tool(fieldExistenceHandler, {
  name: 'FieldExistenceTool',
  description: 'Checks if a field already exists in an object',
  schema: fieldExistenceSchema,
});
