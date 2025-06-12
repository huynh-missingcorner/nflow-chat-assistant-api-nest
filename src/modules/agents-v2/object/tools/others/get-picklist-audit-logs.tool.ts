import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const getPickListAuditLogsSchema = z.object({
  name: z.string().describe('Name of the picklist to get audit logs for'),
  queryParams: z
    .object({
      offset: z.number().min(0).optional().default(0).describe('Offset for pagination'),
      limit: z.number().min(1).max(100).optional().default(20).describe('Limit for pagination'),
      sortBy: z.enum(['timestamp']).optional().default('timestamp').describe('Field to sort by'),
      sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('Sort order'),
      fromDate: z.string().optional().describe('Start date for filtering logs (ISO string)'),
      toDate: z.string().optional().describe('End date for filtering logs (ISO string)'),
      userId: z.string().optional().describe('User ID to filter logs by'),
      action: z.string().optional().describe('Action type to filter logs by'),
    })
    .optional()
    .default({}),
});

type GetPickListAuditLogsInput = z.infer<typeof getPickListAuditLogsSchema>;

const getPickListAuditLogsHandler = async (
  input: GetPickListAuditLogsInput,
): Promise<GetPickListAuditLogsInput> => {
  return new Promise((resolve) => {
    resolve(input);
  });
};

export const getPickListAuditLogsTool = tool(getPickListAuditLogsHandler, {
  name: 'PickListController_getPickListAuditLogs',
  description: 'Get audit logs for a specific picklist with filtering options',
  schema: getPickListAuditLogsSchema,
});
