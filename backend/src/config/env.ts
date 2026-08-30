import 'dotenv/config';
import { z } from 'zod';
import { logger } from '../utils/logger';

const ModelProviderEnum = z.enum(['anthropic', 'openrouter', 'groq', 'openai', 'gemini', 'ollama']);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('4000'),

    DATABASE_URL: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(1),
    SESSION_COOKIE_SECRET: z.string().min(1),

    FRONTEND_URL: z.string().optional(),
    APP_URL: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    LANGSMITH_API_KEY: z.string().optional(),

    REDIS_URL: z.string().min(1),

    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

    GMAIL_USER_NAME: z.string().min(1),
    GMAIL_APP_PASSWORD: z.string().min(1),

    MODEL_PROVIDER: ModelProviderEnum.default('gemini'),
    MODEL_NAME: z.string().default('gemini-3.5-flash'),

    ANTHROPIC_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_API_KEY_BACKUP: z.string().optional(),

    OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'test') {
      return;
    }

    if (data.MODEL_PROVIDER === 'ollama') {
      return;
    }

    const requiredKeyByProvider: Record<
      Exclude<z.infer<typeof ModelProviderEnum>, 'ollama'>,
      keyof typeof data
    > = {
      anthropic: 'ANTHROPIC_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      groq: 'GROQ_API_KEY',
      openai: 'OPENAI_API_KEY',
      gemini: 'GEMINI_API_KEY',
    };

    const requiredKey = requiredKeyByProvider[data.MODEL_PROVIDER];
    const requiredValue = data[requiredKey];

    if (!requiredValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [requiredKey],
        message: `${requiredKey} is required when MODEL_PROVIDER="${data.MODEL_PROVIDER}"`,
      });
    }
  });

const isTest = process.env.NODE_ENV === 'test';

const parsed = EnvSchema.safeParse(
  isTest
    ? {
        ...process.env,

        DATABASE_URL: process.env.DATABASE_URL ?? 'test',
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'test',
        SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET ?? 'test',

        REDIS_URL: process.env.REDIS_URL ?? 'test',

        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? 'test',
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? 'test',
        RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? 'test',

        GMAIL_USER_NAME: process.env.GMAIL_USER_NAME ?? 'test',
        GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ?? 'test',
      }
    : process.env,
);

if (!parsed.success) {
  logger.error(parsed.error.flatten().fieldErrors, 'Invalid or missing environment variables:');

  process.exit(1);
}

export const env = parsed.data;
