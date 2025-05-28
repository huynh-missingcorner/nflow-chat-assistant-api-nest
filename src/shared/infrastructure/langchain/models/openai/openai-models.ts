import { ChatOpenAI } from '@langchain/openai';

export const OPENAI_GPT_4_1 = new ChatOpenAI({
  model: 'gpt-4.1-2025-04-14',
  temperature: 0,
});
