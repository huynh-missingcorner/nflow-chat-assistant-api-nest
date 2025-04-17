import { AgentAction, AgentType } from '../../types';

export interface FlowAgentInput {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  trigger: FlowTrigger;
  actionLogic: string;
}

interface FlowTrigger {
  type: 'manual' | 'scheduled' | 'webhook';
  interval?: string;
  webhookUrl?: string;
}
