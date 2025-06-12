import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const searchPickListsSchema = z.object({
  offset: z.number().min(0).optional().default(0).describe('Offset for pagination'),
  limit: z.number().min(1).max(100).optional().default(20).describe('Limit for pagination'),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'displayName'])
    .optional()
    .default('displayName')
    .describe('Field to sort by'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
  status: z
    .enum(['ALL', 'ACTIVE', 'INACTIVE'])
    .optional()
    .default('ALL')
    .describe('Filter by picklist status'),
  searchText: z
    .string()
    .optional()
    .describe('Text to search for in picklist names and display names'),
  tagNames: z.array(z.string()).optional().describe('Array of tag names to filter by'),
  onlyDeleted: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to only return deleted picklists'),
});

type SearchPickListsInput = z.infer<typeof searchPickListsSchema>;

const searchPickListsHandler = async (
  input: SearchPickListsInput,
): Promise<SearchPickListsInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const searchPickListsTool = tool(searchPickListsHandler, {
  name: 'PickListController_searchPickLists',
  description: 'Search and retrieve picklists with filtering and pagination options',
  schema: searchPickListsSchema,
});
