import { describe, expect, it } from 'vitest';
import { assertAuthEnv } from './auth-env.js';

describe('assertAuthEnv', () => {
  it('allows boot without DATABASE_URL', () => {
    expect(() => assertAuthEnv({})).not.toThrow();
  });

  it('fails fast when DATABASE_URL is set without JWT_SECRET', () => {
    expect(() => assertAuthEnv({ DATABASE_URL: 'postgres://localhost/trailforge' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('fails when JWT_SECRET is too short', () => {
    expect(() =>
      assertAuthEnv({
        DATABASE_URL: 'postgres://localhost/trailforge',
        JWT_SECRET: 'short',
      }),
    ).toThrow(/16/);
  });

  it('accepts DATABASE_URL with JWT_SECRET >= 16 chars', () => {
    expect(() =>
      assertAuthEnv({
        DATABASE_URL: 'postgres://localhost/trailforge',
        JWT_SECRET: '1234567890123456',
      }),
    ).not.toThrow();
  });
});
