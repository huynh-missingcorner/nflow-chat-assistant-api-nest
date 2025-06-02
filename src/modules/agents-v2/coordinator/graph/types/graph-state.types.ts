import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

import { IntentClassifierOutput } from '@/modules/agents-v2/coordinator/tools/intent-classifier.tool';

// Define the state schema for the coordinator graph
export const CoordinatorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  originalMessage: Annotation<string>(),
  chatSessionId: Annotation<string>(),
  classifiedIntent: Annotation<IntentClassifierOutput | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  error: Annotation<string | null>({
    default: () => null,
    reducer: (x, y) => y ?? x,
  }),
  currentNode: Annotation<string>({
    default: () => 'start',
    reducer: (x, y) => y ?? x,
  }),
  retryCount: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => y ?? x,
  }),
});

export type CoordinatorStateType = typeof CoordinatorState.State;

export interface GraphNodeResult {
  success: boolean;
  data?: Partial<CoordinatorStateType>;
  error?: string;
}

export interface DomainIntentCombination {
  domain: string;
  intent: string;
}

export interface GraphConfiguration {
  maxRetryCount: number;
  defaultThreadId: string;
  initialNode: string;
}

export interface NodeExecutionContext {
  state: CoordinatorStateType;
  config?: GraphConfiguration;
}
