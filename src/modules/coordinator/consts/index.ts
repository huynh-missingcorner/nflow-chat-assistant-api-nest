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
