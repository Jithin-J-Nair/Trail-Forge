import { describe, expect, it } from 'vitest';
import { conditionFromWmo } from './openmeteo.js';
import { resolveWeather } from './resolve-weather.js';

describe('resolveWeather', () => {
  it('returns unavailable when no provider configured', () => {
    const s = resolveWeather({});
    expect(s.state).toBe('unavailable');
    expect(s.label).toMatch(/unavailable/i);
  });

  it('returns unavailable for explicit off', () => {
    const s = resolveWeather({ provider: 'off' });
    expect(s.state).toBe('unavailable');
  });

  it('opts into Open-Meteo as loading (not fake live weather)', () => {
    const s = resolveWeather({ provider: 'openmeteo' });
    expect(s.state).toBe('loading');
    expect(s.source).toBe('openmeteo');
    expect(s.state).not.toBe('live');
  });
});

describe('conditionFromWmo', () => {
  it('maps clear and rain codes', () => {
    expect(conditionFromWmo(0)).toBe('Clear');
    expect(conditionFromWmo(61)).toBe('Rain');
    expect(conditionFromWmo(71)).toBe('Snow');
  });
});
