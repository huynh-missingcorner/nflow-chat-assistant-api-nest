import { AgentAction, AgentType } from '../../types';

export interface LayoutAgentInput {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  pages: string[];
}
