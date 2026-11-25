import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applies defaults for local development', () => {
    const env = loadEnv({
      NODE_ENV: 'development',
    });
    expect(env.PORT).toBe(3001);
    expect(env.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  it('fails fast on invalid PORT', () => {
    expect(() => loadEnv({ PORT: 'nope' })).toThrow(/Invalid environment/);
  });
});
