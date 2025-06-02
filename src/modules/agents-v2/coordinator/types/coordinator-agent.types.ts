import { IntentClassifierOutput } from '../tools/intent-classifier.tool';

export type CoordinatorAgentInput = {
  message: string;
  chatSessionId: string;
};

export type CoordinatorAgentSuccessOutput = {
  success: true;
  message: string;
  data: {
    classifiedIntent?: IntentClassifierOutput;
    originalMessage: string;
    chatSessionId: string;
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
