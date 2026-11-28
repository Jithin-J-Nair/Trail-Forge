import { afterEach, describe, expect, it } from 'vitest';
import { asDemoFixture, isDemoMode } from './demo.js';
import { SAMPLE_RESPONSE } from './fixtures/sample-response.js';

describe('demo gate', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('is off by default', () => {
    window.history.replaceState({}, '', '/app');
    expect(isDemoMode()).toBe(false);
  });

  it('is on for ?demo=1', () => {
    window.history.replaceState({}, '', '/app?demo=1');
    expect(isDemoMode()).toBe(true);
  });

  it('labels fixtures as demo', () => {
    const labeled = asDemoFixture({ ...SAMPLE_RESPONSE, demo: false });
    expect(labeled.demo).toBe(true);
    expect(SAMPLE_RESPONSE.provenance?.attribution).toMatch(/DEMO/i);
  });
});
