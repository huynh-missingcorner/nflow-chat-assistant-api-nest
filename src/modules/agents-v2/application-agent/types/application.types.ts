export interface ApplicationAgentInput {
  message: string;
}

export interface ApplicationAgentOutput {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}
