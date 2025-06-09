import { ChatOpenAI } from '@langchain/openai';

// Model for summary. The temperature is set to 0.7 to allow for some creativity.
export const OPENAI_GPT_4_1_FOR_SUMMARY = new ChatOpenAI({
  model: 'gpt-4.1-2025-04-14',
  temperature: 0.7,
});

// Model for tool calls. The temperature is set to 0 to avoid hallucinations.
export const OPENAI_GPT_4_1_FOR_TOOLS = new ChatOpenAI({
  model: 'gpt-4.1',
  temperature: 0,
});
