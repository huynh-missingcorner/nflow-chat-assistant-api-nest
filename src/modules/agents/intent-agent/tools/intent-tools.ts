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
              id: { type: 'string' },
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
                items: { type: 'string' },
                description: 'List of task IDs that must be completed before this task can start',
              },
              data: {
                description: 'Task-specific payload depending on the agent',
                anyOf: [
                  // ApplicationAgentData
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

                  // ObjectAgentData
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
                        enum: ['create', 'update', 'delete'],
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
                            fields: {
                              type: ['array', 'null'],
                              items: {
                                type: 'object',
                                properties: {
                                  name: { type: 'string', description: 'Name of the field' },
                                  type: {
                                    type: 'string',
                                    enum: [
                                      'numeric',
                                      'text',
                                      'dateTime',
                                      'boolean',
                                      'pickList',
                                      'json',
                                      'generated',
                                      'currency',
                                      'externalRelation',
                                      'indirectRelation',
                                      'relation',
                                      'objectReference',
                                      'flowReference',
                                      'rollup',
                                      'formula',
                                      'file',
                                    ],
                                    description: 'Type of the field',
                                  },
                                  required: {
                                    type: 'boolean',
                                    description: 'Is the field required',
                                  },
                                  enumValues: {
                                    type: ['array', 'null'],
                                    items: { type: 'string' },
                                    description: 'List of possible values for the field',
                                  },
                                },
                                required: ['name', 'type', 'required', 'enumValues'],
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ['name', 'description', 'fields'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['agentType', 'action', 'objects'],
                    additionalProperties: false,
                  },

                  // LayoutAgentData
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

                  // FlowAgentData
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
            required: ['id', 'agent', 'description', 'data', 'dependsOn'],
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
