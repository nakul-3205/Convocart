import 'dotenv/config';
import { z } from 'zod';

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

    // Provider API keys
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_API_KEY_BACKUP: z.string().optional(),

    // Local Ollama
    OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  })
  .superRefine((data, ctx) => {
    // Ollama doesn't require an API key
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

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid or missing environment variables:', parsed.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsed.data;
