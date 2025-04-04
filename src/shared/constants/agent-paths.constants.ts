import * as path from 'path';

export const AGENTS_BASE_PATH = 'modules/agents';

export const AGENT_PATHS = {
  INTENT: path.join(AGENTS_BASE_PATH, 'intent-agent'),
  APPLICATION: path.join(AGENTS_BASE_PATH, 'application-agent'),
  FLOW: path.join(AGENTS_BASE_PATH, 'flow-agent'),
  LAYOUT: path.join(AGENTS_BASE_PATH, 'layout-agent'),
  OBJECT: path.join(AGENTS_BASE_PATH, 'object-agent'),
} as const;

export const getAgentContextPath = (agentPath: string): string => {
  return path.join('src', agentPath, 'context.md');
};
