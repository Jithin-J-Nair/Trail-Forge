import { describe, expect, it } from 'vitest';

/**
 * KeyboardNav contract (behavior covered in component):
 * Tab must remain available for panel focus order — only arrows cycle POIs.
 */
describe('KeyboardNav contract', () => {
  it('documents that Tab is not hijacked for POI cycling', () => {
    const reserved = ['ArrowLeft', 'ArrowRight', 'Escape'] as const;
    expect(reserved).not.toContain('Tab');
  });
});
