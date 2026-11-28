import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).optional(),
  OLLAMA_HOST: z.string().min(1).optional(),
  OLLAMA_MODEL: z.string().min(1).optional(),
  LLM_PROVIDER: z.enum(['mock', 'claude', 'ollama']).default('mock'),
  REDIS_URL: z.string().min(1).optional(),
  GEOAPIFY_API_KEY: z.string().min(1).optional(),
  MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
  OPENROUTESERVICE_API_KEY: z.string().min(1).optional(),
  GRAPHHOPPER_API_KEY: z.string().min(1).optional(),
  LOCAL_DEV_DATA_SOURCE: z.enum(['true', 'false']).default('false'),
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
    ANTHROPIC_MODEL: source['ANTHROPIC_MODEL'] || undefined,
    OLLAMA_HOST: source['OLLAMA_HOST'] || undefined,
    OLLAMA_MODEL: source['OLLAMA_MODEL'] || undefined,
    LLM_PROVIDER: source['LLM_PROVIDER'] || undefined,
    REDIS_URL: source['REDIS_URL'] || undefined,
    GEOAPIFY_API_KEY: source['GEOAPIFY_API_KEY'] || undefined,
    MAPBOX_ACCESS_TOKEN: source['MAPBOX_ACCESS_TOKEN'] || undefined,
    OPENROUTESERVICE_API_KEY: source['OPENROUTESERVICE_API_KEY'] || undefined,
    GRAPHHOPPER_API_KEY: source['GRAPHHOPPER_API_KEY'] || undefined,
    LOCAL_DEV_DATA_SOURCE: source['LOCAL_DEV_DATA_SOURCE'] || undefined,
  });

  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(details)}`);
  }

  return parsed.data;
}
