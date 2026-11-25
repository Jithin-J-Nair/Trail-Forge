import type { Claim, PoiContent, PoiLocal, VerificationSummary } from '@trailforge/shared';
import type { LlmGenerateDraft } from './schemas.js';

const NUMBER_RE = /\d+(?:[.:]\d+)?/g;
const URL_RE = /https?:\/\/[^\s]+/gi;

function extractSensitiveTokens(text: string): string[] {
  const nums = text.match(NUMBER_RE) ?? [];
  const urls = text.match(URL_RE) ?? [];
  return [...nums, ...urls];
}

function claimIssues(claim: Claim, poiById: Map<string, PoiLocal>): string[] {
  const issues: string[] = [];

  // (4) no sourceTags -> needs_review
  if (claim.sourceTags.length === 0) {
    issues.push('claim_missing_source_tags');
    return issues;
  }

  for (const src of claim.sourceTags) {
    // (1) poiId must exist
    const poi = poiById.get(src.poiId);
    if (!poi) {
      issues.push(`unknown_poi:${src.poiId}`);
      continue;
    }
    // (2) cited key must exist on that POI
    if (!(src.key in poi.osmTags)) {
      issues.push(`missing_tag:${src.poiId}.${src.key}`);
      continue;
    }
  }

  // (3) numbers/times/URLs in text must appear in a cited tag value
  const citedValues = claim.sourceTags
    .map((s) => poiById.get(s.poiId)?.osmTags[s.key])
    .filter((v): v is string => typeof v === 'string');
  const joined = citedValues.join(' ');
  for (const token of extractSensitiveTokens(claim.text)) {
    if (!joined.includes(token)) {
      issues.push(`ungrounded_token:${token}`);
    }
  }

  return issues;
}

export type GroundingResult = {
  content: PoiContent[];
  verification: VerificationSummary;
  /** POI ids returned by the LLM that were not in the input (rejected). */
  hallucinatedPoiIds: string[];
};

/**
 * Grounding validator: every claim must be backed only by provided OSM tags.
 * Heavily commented because this is the product's trust boundary.
 */
export function groundLlmDraft(inputPois: PoiLocal[], draft: LlmGenerateDraft): GroundingResult {
  const poiById = new Map(inputPois.map((p) => [p.id, p]));
  const inputIds = new Set(poiById.keys());
  const hallucinatedPoiIds: string[] = [];
  const content: PoiContent[] = [];

  for (const item of draft.pois) {
    // (5) POIs invented by the LLM are rejected and removed
    if (!inputIds.has(item.poiId)) {
      hallucinatedPoiIds.push(item.poiId);
      continue;
    }

    const issues: string[] = [];
    const check = (claims: Claim[]): Claim[] => {
      const kept: Claim[] = [];
      for (const claim of claims) {
        const claimIssueList = claimIssues(claim, poiById);
        issues.push(...claimIssueList);
        kept.push(claim);
      }
      return kept;
    };

    const ja = check(item.ja);
    const en = check(item.en);
    const status: PoiContent['status'] = issues.length === 0 ? 'verified' : 'needs_review';

    content.push({
      poiId: item.poiId,
      ja,
      en,
      status,
      issues: [...new Set(issues)],
    });
  }

  for (const poi of inputPois) {
    if (!content.some((c) => c.poiId === poi.id)) {
      content.push({
        poiId: poi.id,
        ja: [],
        en: [],
        status: 'needs_review',
        issues: ['llm_omitted_poi'],
      });
    }
  }

  const verification: VerificationSummary = {
    verified: content.filter((c) => c.status === 'verified').length,
    needsReview: content.filter((c) => c.status === 'needs_review').length,
    rejected: hallucinatedPoiIds.length,
    total: inputPois.length + hallucinatedPoiIds.length,
  };

  return { content, verification, hallucinatedPoiIds };
}
