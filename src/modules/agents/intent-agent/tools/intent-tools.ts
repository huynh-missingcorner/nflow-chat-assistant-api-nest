import { ChatCompletionTool } from 'openai/resources/index.mjs';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
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
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['ApplicationAgent', 'ObjectAgent', 'LayoutAgent', 'FlowAgent'],
                  },
                  description: 'Optional list of agents this task depends on',
                },
                data: {
                  description: 'Task-specific payload depending on the agent',
                  oneOf: [
                    {
                      title: 'ApplicationAgentData',
                      type: 'object',
                      properties: {
                        action: { type: 'string', enum: ['create'] },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        icon: { type: 'string', description: 'Optional icon for the app' },
                        visibility: {
                          type: 'string',
                          enum: ['public', 'private'],
                          default: 'private',
                        },
                        slug: { type: 'string', description: 'Optional unique identifier' },
                      },
                      required: ['action', 'name'],
                    },
                    {
                      title: 'ObjectAgentData',
                      type: 'object',
                      properties: {
                        action: { type: 'string', enum: ['create'] },
                        objects: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              description: { type: 'string' },
                              requiredFields: { type: 'array', items: { type: 'string' } },
                            },
                            required: ['name', 'description', 'requiredFields'],
                          },
                        },
                      },
                      required: ['action', 'objects'],
                    },
                    {
                      title: 'LayoutAgentData',
                      type: 'object',
                      properties: {
                        action: { type: 'string', enum: ['create'] },
                        pages: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                        bindings: {
                          type: 'object',
                          additionalProperties: { type: 'string' },
                          description: 'Map objects to page names',
                        },
                      },
                      required: ['action', 'pages', 'bindings'],
                    },
                    {
                      title: 'FlowAgentData',
                      type: 'object',
                      properties: {
                        action: { type: 'string', enum: ['create'] },
                        trigger: { type: 'string', description: 'Event that starts the flow' },
                        actionLogic: {
                          type: 'string',
                          description: 'What should happen in the flow',
                        },
                      },
                      required: ['action', 'trigger', 'actionLogic'],
                    },
                  ],
                },
              },
              required: ['agent', 'description', 'data'],
            },
          },
        },
        required: ['summary', 'tasks'],
      },
    },
  },
];
