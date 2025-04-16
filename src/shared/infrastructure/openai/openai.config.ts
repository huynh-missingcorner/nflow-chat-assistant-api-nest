export interface OpenAIConfig {
  apiKey: string;
  defaultModel: string;
  defaultMaxTokens: number;
  defaultTemperature: number;
}

export const DEFAULT_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_MAX_TOKENS = 5000;
export const DEFAULT_TEMPERATURE = 0.2;

export const createOpenAIConfig = (): OpenAIConfig => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    apiKey,
    defaultModel: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    defaultMaxTokens: Number(process.env.OPENAI_MAX_TOKENS) || DEFAULT_MAX_TOKENS,
    defaultTemperature: Number(process.env.OPENAI_TEMPERATURE) || DEFAULT_TEMPERATURE,
  };
};
