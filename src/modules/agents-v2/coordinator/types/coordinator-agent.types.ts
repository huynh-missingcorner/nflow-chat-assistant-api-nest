import {
  ApplicationExecutionResult,
  ApplicationSpec,
  EnrichedApplicationSpec,
} from '@/modules/agents-v2/application/types/application-graph-state.types';

import { IntentClassifierOutput } from '../tools/intent-classifier.tool';

export type CoordinatorAgentInput = {
  message: string;
  chatSessionId: string;
};

export type CoordinatorAgentSuccessOutput = {
  success: true;
  message: string;
  data: {
    classifiedIntent: IntentClassifierOutput;
    originalMessage: string;
    chatSessionId: string;
    // Optional application fields (when application subgraph is executed)
    applicationSpec?: ApplicationSpec | null;
    enrichedSpec?: EnrichedApplicationSpec | null;
    executionResult?: ApplicationExecutionResult | null;
    isCompleted?: boolean;
  };
};

export type CoordinatorAgentErrorOutput = {
  success: false;
  message: string;
  data: {
    error: string;
  };
};

export type CoordinatorAgentOutput = CoordinatorAgentSuccessOutput | CoordinatorAgentErrorOutput;
