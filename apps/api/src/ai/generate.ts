import type { PoiLocal } from '@trailforge/shared';
import { buildUserDataJson, SYSTEM_PROMPT } from './prompt.js';
import type { LlmJsonProvider } from './provider.js';
import { LlmGenerateDraftSchema, type LlmGenerateDraft } from './schemas.js';

export class LlmSchemaError extends Error {
  readonly code = 'llm_schema_error' as const;
  constructor(message: string) {
    super(message);
    this.name = 'LlmSchemaError';
  }
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function coerceUnknown(raw: unknown): unknown {
  if (typeof raw === 'string') {
    return JSON.parse(stripFences(raw));
  }
  return raw;
}

export async function generatePoiDraft(
  provider: LlmJsonProvider,
  pois: PoiLocal[],
): Promise<LlmGenerateDraft> {
  const userData = buildUserDataJson(pois);
  const first = coerceUnknown(await provider.generateJson(SYSTEM_PROMPT, userData));
  const parsed = LlmGenerateDraftSchema.safeParse(first);
  if (parsed.success) return parsed.data;

  const repairSystem = `${SYSTEM_PROMPT}\nPrevious output failed schema validation. Return corrected JSON only.`;
  const second = coerceUnknown(await provider.generateJson(repairSystem, userData));
  const repaired = LlmGenerateDraftSchema.safeParse(second);
  if (!repaired.success) {
    throw new LlmSchemaError(repaired.error.message);
  }
  return repaired.data;
}
