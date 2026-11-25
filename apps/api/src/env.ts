import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OLLAMA_HOST: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/** Fail fast on invalid process env. Call once at process startup. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse({
    NODE_ENV: source['NODE_ENV'],
    PORT: source['PORT'],
    LOG_LEVEL: source['LOG_LEVEL'],
    CORS_ORIGIN: source['CORS_ORIGIN'],
    ANTHROPIC_API_KEY: source['ANTHROPIC_API_KEY'] || undefined,
    OLLAMA_HOST: source['OLLAMA_HOST'] || undefined,
  });

  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(details)}`);
  }

  return parsed.data;
}
