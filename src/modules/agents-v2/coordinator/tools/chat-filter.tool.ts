import { tool } from '@langchain/core/tools';
import z from 'zod';

// Schema for determining if user wants nflow operations or casual chat
export const ChatFilterSchema = z.object({
  isNflowOperation: z
    .boolean()
    .describe(
      'True if user wants to create, delete, update, or manage nflow resources (applications, objects, layouts, flows). False for casual chat, greetings, questions about status/capabilities, or general conversation.',
    ),
  chatResponse: z
    .string()
    .optional()
    .describe(
      'If isNflowOperation is false, provide a helpful chat response here. Include session information if user asks about status/entities.',
    ),
});

export type ChatFilterOutput = z.infer<typeof ChatFilterSchema>;

const chatFilterHandler = (input: ChatFilterOutput): ChatFilterOutput => {
  return input;
};

export const ChatFilterTool = tool(chatFilterHandler, {
  name: 'ChatFilterTool',
  description:
    'Determines if the user wants to perform nflow operations or just have a casual conversation',
  schema: ChatFilterSchema,
});
