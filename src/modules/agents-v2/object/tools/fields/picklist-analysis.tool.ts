import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Schema for pickList item analysis
const pickListItemAnalysisSchema = z.object({
  name: z.string().describe('Technical name for the pickList item'),
  displayName: z.string().describe('User-friendly display name'),
  order: z.number().optional().describe('Order in the list'),
  action: z
    .enum(['CREATE', 'UPDATE', 'DELETE', 'RESTORE'])
    .default('CREATE')
    .describe('Action to perform on the pickList item'),
});

// Schema for pickList analysis results
const pickListAnalysisResultSchema = z.object({
  isPickListField: z.boolean().describe('Whether this field should be a pickList type'),
  needsNewPickList: z.boolean().describe('Whether a new pickList needs to be created'),
  reasoning: z.string().describe('Explanation of the analysis decision'),
  suggestedPickListName: z.string().optional().describe('Suggested name for the new pickList'),
  suggestedPickListDisplayName: z
    .string()
    .optional()
    .describe('Suggested display name for the pickList'),
  suggestedPickListDescription: z
    .string()
    .optional()
    .describe('Suggested description for the pickList'),
  extractedItems: z
    .array(pickListItemAnalysisSchema)
    .optional()
    .describe('Items extracted from user input for the pickList'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1) in the analysis'),
});

const pickListAnalysisSchema = z.object({
  fieldSpec: z
    .object({
      name: z.string(),
      typeHint: z.string(),
      description: z.string().optional(),
      objectName: z.string().optional(),
    })
    .describe('The field specification to analyze'),
  userMessage: z.string().describe('The original user message for context'),
  pickListAnalysis: pickListAnalysisResultSchema.describe(
    'Analysis results for pickList requirements',
  ),
});

type PickListAnalysisInput = z.infer<typeof pickListAnalysisSchema>;

const pickListAnalysisHandler = async (
  input: PickListAnalysisInput,
): Promise<PickListAnalysisInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const pickListAnalysisTool = tool(pickListAnalysisHandler, {
  name: 'PickListAnalysisTool',
  description:
    'Analyzes field specifications to determine if pickList creation is needed and extracts pickList details from user input',
  schema: pickListAnalysisSchema,
});
