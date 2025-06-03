import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const AppUnderstandingSchema = z.object({
  appName: z.string().describe('The name of the application to be created'),
  description: z.string().optional().describe('Description of the application purpose'),
  objects: z.array(z.string()).optional().describe('List of object/entity names mentioned'),
  layouts: z.array(z.string()).optional().describe('List of layout/form names mentioned'),
  flows: z.array(z.string()).optional().describe('List of workflow/process names mentioned'),
  metadata: z.record(z.unknown()).optional().describe('Additional metadata or configuration'),
});

export type AppUnderstandingInput = z.infer<typeof AppUnderstandingSchema>;

const appUnderstandingHandler = async (input: AppUnderstandingInput): Promise<string> => {
  // This tool is used by the LLM to structure its understanding
  // The actual logic is handled by the AppUnderstandingNode
  return Promise.resolve(
    JSON.stringify({
      success: true,
      data: input,
      message: 'Application specification extracted successfully',
    }),
  );
};

export const appUnderstandingTool = tool(appUnderstandingHandler, {
  name: 'app_understanding_extractor',
  description: `
    Extract application specification from natural language input.
    Parse user requests to identify:
    - Application name and purpose
    - Required objects/entities (like Customer, Order, Product)
    - Required layouts/forms (like Customer Form, Order List)
    - Required workflows/flows (like Order Processing, Customer Onboarding)
    - Any additional configuration or metadata
  `,
  schema: AppUnderstandingSchema,
});
