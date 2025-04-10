import { ChatCompletionTool } from 'openai/resources/index.mjs';

export interface IntentTask {
  agent: 'ApplicationAgent' | 'ObjectAgent' | 'LayoutAgent' | 'FlowAgent';
  description: string;
  data: Record<string, unknown>;
  dependsOn?: ('ApplicationAgent' | 'ObjectAgent' | 'LayoutAgent' | 'FlowAgent')[];
}

export interface IntentPlan {
  summary: string;
  tasks: IntentTask[];
}

export interface IntentToolResponse {
  id: string;
  type: 'function';
  function: {
    name: 'create_intent_plan';
    arguments: string; // JSON string containing IntentPlan
  };
}

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
            description: 'A short summary of the goal or app to be built',
          },
          tasks: {
            type: 'array',
            description: 'Step-by-step plan for what each agent should do',
            items: {
              type: 'object',
              properties: {
                agent: {
                  type: 'string',
                  enum: ['ApplicationAgent', 'ObjectAgent', 'LayoutAgent', 'FlowAgent'],
                  description: 'The responsible agent for the task',
                },
                description: {
                  type: 'string',
                  description: 'Natural language description of what this task does',
                },
                data: {
                  type: 'object',
                  description: 'JSON payload to pass to the downstream domain agent',
                },
                dependsOn: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['ApplicationAgent', 'ObjectAgent', 'LayoutAgent', 'FlowAgent'],
                  },
                  description: 'Other agent names this task depends on',
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
