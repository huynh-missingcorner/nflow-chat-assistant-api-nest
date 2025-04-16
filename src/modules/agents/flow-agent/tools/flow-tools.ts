import { FunctionTool } from 'openai/resources/responses/responses.mjs';

export const createFlowTool: FunctionTool = {
  type: 'function',
  name: 'ApiFlowController_createFlow',
  description: 'Create new Flow and First Template',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the flow',
      },
      displayName: {
        type: 'string',
        description: 'Display name of the flow',
      },
      type: {
        type: 'string',
        description: 'Type of the flow',
        enum: ['screen', 'action', 'time-based', 'data', 'event', 'ai-chat'],
        default: 'screen',
      },
      description: {
        type: 'string',
        description: 'Description of the flow',
      },
    },
    required: ['name', 'displayName', 'type'],
    additionalProperties: false,
  },
  strict: true,
};
