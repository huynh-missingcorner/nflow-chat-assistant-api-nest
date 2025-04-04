export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export const DEFAULT_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_MAX_TOKENS = 2000;
export const DEFAULT_TEMPERATURE = 0.7;

export const createOpenAIConfig = (): OpenAIConfig => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    maxTokens: Number(process.env.MAX_TOKENS) || DEFAULT_MAX_TOKENS,
    temperature: Number(process.env.TEMPERATURE) || DEFAULT_TEMPERATURE,
  };
};
