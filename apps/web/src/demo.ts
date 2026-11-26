import type { GenerateResponse } from '@trailforge/shared';

/** Client DEMO_MODE: VITE_DEMO_MODE=true or ?demo=1. Fixtures must stay labeled. */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true;
  return new URLSearchParams(window.location.search).get('demo') === '1';
}

export function asDemoFixture(data: GenerateResponse): GenerateResponse {
  return { ...data, demo: true };
}
