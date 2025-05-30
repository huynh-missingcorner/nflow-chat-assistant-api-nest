import { AgentAction, AgentType } from '@/modules/agents/types';

export interface ApplicationAgentInput {
  action: AgentAction;
  name: string;
  description: string;
  agentType: AgentType;
  visibility: 'public' | 'private';
  slug: string;
}
