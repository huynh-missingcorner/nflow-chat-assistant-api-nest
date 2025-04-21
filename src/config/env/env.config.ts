import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_PORT: z.coerce.number().min(0).max(65535).default(5432),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().regex(/^\d+[smhd]$/),

  // Redis
  REDIS_URL: z.string().url(),

  // OpenAI
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  OPENAI_MAX_TOKENS: z.coerce.number().default(2000),
  OPENAI_TEMPERATURE: z.coerce.number().default(0.7),

  // Nflow
  NFLOW_CLIENT_URL: z.string().url(),
  NFLOW_API_URL: z.string().url(),
  NFLOW_API_KEY: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export default registerAs('env', () => {
  const config = envSchema.parse(process.env);
  return config;
});
