export enum Agent {
  ApplicationAgent = 'ApplicationAgent',
  ObjectAgent = 'ObjectAgent',
  LayoutAgent = 'LayoutAgent',
  FlowAgent = 'FlowAgent',
}

export const AGENT_LIST = [
  Agent.ApplicationAgent,
  Agent.ObjectAgent,
  Agent.LayoutAgent,
  Agent.FlowAgent,
] as const;

export type ActiveAgent = (typeof AGENT_LIST)[number];

export interface AgentStatus {
  agent: ActiveAgent;
  enabled: boolean;
  description: string;
}

export const DEFAULT_AGENT_STATUS: Record<ActiveAgent, AgentStatus> = {
  [Agent.ApplicationAgent]: {
    agent: Agent.ApplicationAgent,
    enabled: true,
    description: 'Application structure generation',
  },
  [Agent.ObjectAgent]: {
    agent: Agent.ObjectAgent,
    enabled: true,
    description: 'Data model and objects generation',
  },
  [Agent.LayoutAgent]: {
    agent: Agent.LayoutAgent,
    enabled: true,
    description: 'UI layout and components generation',
  },
  [Agent.FlowAgent]: {
    agent: Agent.FlowAgent,
    enabled: true,
    description: 'Business logic flow generation',
  },
};
