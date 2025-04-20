import { Agent } from '../../types';
import { AGENT_LIST } from '../../types';

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
