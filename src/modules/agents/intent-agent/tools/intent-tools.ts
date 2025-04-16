import { FunctionTool } from 'openai/resources/responses/responses.mjs';

export const tools: FunctionTool[] = [
  {
    type: 'function',
    name: 'create_intent_plan',
    description: 'Generate a structured plan with multiple tasks for Nflow micro-agent system',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'A short summary of the app or use case the user wants to build',
        },
        tasks: {
          type: 'array',
          description: 'List of tasks, each executed by a specific domain agent',
          items: {
            type: 'object',
            properties: {
              agent: {
                type: 'string',
                description: 'Which agent should perform this task',
                enum: ['ApplicationAgent', 'ObjectAgent', 'LayoutAgent', 'FlowAgent'],
              },
              description: {
                type: 'string',
                description: 'A human-readable explanation of the task',
              },
              dependsOn: {
                type: ['array', 'null'],
                items: {
                  type: 'string',
                  enum: ['ApplicationAgent', 'ObjectAgent', 'LayoutAgent', 'FlowAgent'],
                },
                description: 'Optional list of agents this task depends on',
              },
              data: {
                description: 'Task-specific payload depending on the agent',
                anyOf: [
                  {
                    title: 'ApplicationAgentData',
                    type: 'object',
                    description: 'Data for the Application Agent',
                    properties: {
                      agentType: {
                        type: 'string',
                        enum: ['application'],
                        description: 'Type of the agent data',
                      },
                      action: {
                        type: 'string',
                        enum: ['create'],
                        description: 'Action to perform',
                      },
                      name: { type: 'string', description: 'Name of the application' },
                      description: {
                        type: 'string',
                        description: 'Description of the application',
                      },
                      visibility: {
                        type: 'string',
                        enum: ['public', 'private'],
                        default: 'private',
                        description: 'Visibility of the application',
                      },
                      slug: { type: 'string', description: 'Optional unique identifier' },
                    },
                    required: ['agentType', 'action', 'name', 'description', 'visibility', 'slug'],
                    additionalProperties: false,
                  },
                  {
                    title: 'ObjectAgentData',
                    type: 'object',
                    description: 'Data for the Object Agent',
                    properties: {
                      agentType: {
                        type: 'string',
                        enum: ['object'],
                        description: 'Type of the agent data',
                      },
                      action: {
                        type: 'string',
                        enum: ['create'],
                        description: 'Action to perform',
                      },
                      objects: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', description: 'Name of the object' },
                            description: {
                              type: 'string',
                              description: 'Description of the object',
                            },
                            requiredFields: {
                              type: 'array',
                              items: { type: 'string' },
                              description: 'Required fields for the object',
                            },
                          },
                          required: ['name', 'description', 'requiredFields'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['agentType', 'action', 'objects'],
                    additionalProperties: false,
                  },
                  {
                    title: 'LayoutAgentData',
                    type: 'object',
                    description: 'Data for the Layout Agent',
                    properties: {
                      agentType: {
                        type: 'string',
                        enum: ['layout'],
                        description: 'Type of the agent data',
                      },
                      action: {
                        type: 'string',
                        enum: ['create'],
                        description: 'Action to perform',
                      },
                      pages: {
                        type: 'array',
                        items: { type: 'string', description: 'Name of the page' },
                        description: 'List of pages in the layout',
                      },
                    },
                    required: ['agentType', 'action', 'pages'],
                    additionalProperties: false,
                  },
                  {
                    title: 'FlowAgentData',
                    type: 'object',
                    description: 'Data for the Flow Agent',
                    properties: {
                      agentType: {
                        type: 'string',
                        enum: ['flow'],
                        description: 'Type of the agent data',
                      },
                      action: {
                        type: 'string',
                        enum: ['create'],
                        description: 'Action to perform',
                      },
                      trigger: {
                        type: 'string',
                        description: 'Event that starts the flow',
                      },
                      actionLogic: {
                        type: 'string',
                        description: 'What should happen in the flow',
                      },
                    },
                    required: ['agentType', 'action', 'trigger', 'actionLogic'],
                    additionalProperties: false,
                  },
                ],
              },
            },
            required: ['agent', 'description', 'data', 'dependsOn'],
            additionalProperties: false,
          },
        },
      },
      required: ['summary', 'tasks'],
      additionalProperties: false,
    },
    strict: true,
  },
];
