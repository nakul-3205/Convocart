import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  SESSION_COOKIE_SECRET: z.string().min(1),
  FRONTEND_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  LANGSMITH_API_KEY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid or missing environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;