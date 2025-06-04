import {
  DBDesignResult,
  FieldSpec,
  ObjectExecutionResult,
  ObjectSpec,
  TypeMappingResult,
} from './object-graph-state.types';

export interface ObjectAgentInput {
  message: string;
  chatSessionId: string;
}

export interface ObjectAgentOutput {
  success: boolean;
  message: string;
  data: ObjectAgentSuccessData | ObjectAgentErrorData;
}

export interface ObjectAgentSuccessData {
  executionResult: ObjectExecutionResult;
  originalMessage: string;
  chatSessionId: string;
  fieldSpec: FieldSpec | null;
  objectSpec: ObjectSpec | null;
  dbDesignResult: DBDesignResult | null;
  typeMappingResult: TypeMappingResult | null;
}

export interface ObjectAgentErrorData {
  error: string;
  currentNode?: string;
  retryCount?: number;
}
