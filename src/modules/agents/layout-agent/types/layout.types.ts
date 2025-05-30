import { AgentAction, AgentType } from '@/modules/agents/types';

export interface LayoutAgentInput {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  pages: string[];
}
