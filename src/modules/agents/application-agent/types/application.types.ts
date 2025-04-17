import { AgentAction, AgentType } from '../../types';

export interface ApplicationAgentInput {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  visibility: 'public' | 'private';
  slug: string;
}
