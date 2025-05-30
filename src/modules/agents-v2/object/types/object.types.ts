export interface ObjectAgentInput {
  message: string;
}

export interface ObjectAgentOutput {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}
