import { randomUUID } from 'node:crypto';
import {
  aggregateVerificationStatus,
  type Claim,
  type ClaimType,
  type Evidence,
  type VerificationResult,
  type VerificationStatus,
} from './verification.js';
import type { CanonicalPlace } from './place.js';

export interface PlaceFactStore {
  getById(placeId: string): Promise<CanonicalPlace | null>;
  getBySource(sourceType: string, sourceId: string): Promise<CanonicalPlace | null>;
}

export interface ClaimVerificationInput {
  claim: Claim;
  place?: CanonicalPlace | null;
}

export interface ClaimVerifier {
  verify(input: ClaimVerificationInput): Promise<VerificationResult>;
}

const VERIFIED_THRESHOLD = 0.9;
const PARTIAL_THRESHOLD = 0.6;

function scoreToStatus(score: number): VerificationStatus {
  if (score >= VERIFIED_THRESHOLD) return 'VERIFIED';
  if (score >= PARTIAL_THRESHOLD) return 'PARTIALLY_VERIFIED';
  return 'NEEDS_REVIEW';
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function containsFact(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  return n.length > 1 && normalize(haystack).includes(n);
}

function evidenceForPlace(place: CanonicalPlace, factPath: string, observed: unknown): Evidence {
  return {
    sourceType: place.canonicalSource,
    sourceId: place.canonicalSourceId,
    factPath,
    observed,
    weight: 1,
  };
}

/**
 * Deterministic rule-based verifier. It only verifies claims that can be
 * supported by canonical source facts. Unknown or unsupported claims become
 * NEEDS_REVIEW — never VERIFIED.
 */
export class RuleBasedClaimVerifier implements ClaimVerifier {
  async verify(input: ClaimVerificationInput): Promise<VerificationResult> {
    const { claim, place } = input;
    const verifiedAt = new Date().toISOString();

    if (!place) {
      return {
        claimId: claim.id,
        status: 'NEEDS_REVIEW',
        confidence: 0,
        reason: 'No canonical place record found for claim.',
        matcher: 'rule',
        evidence: [],
        verifiedAt,
      };
    }

    const evidence: Evidence[] = [];
    let score = 0;
    const reasons: string[] = [];

    // Existence: canonical place with source is enough for existence claims.
    if (claim.claimType === 'existence') {
      score = 1;
      evidence.push(evidenceForPlace(place, 'canonicalSourceId', place.canonicalSourceId));
      reasons.push('Place exists in canonical source.');
    }

    // Location: check coordinates/name presence in claim context.
    if (claim.claimType === 'location') {
      const hasName = containsFact(claim.text, place.name) || (place.nameLocal ? containsFact(claim.text, place.nameLocal) : false);
      const hasCoord =
        claim.text.includes(place.location.lat.toFixed(3)) ||
        claim.text.includes(place.location.lng.toFixed(3));
      if (hasName) {
        score += 0.7;
        evidence.push(evidenceForPlace(place, 'name', place.name));
        reasons.push('Claim references canonical place name.');
      }
      if (hasCoord) {
        score += 0.3;
        evidence.push(evidenceForPlace(place, 'location', place.location));
        reasons.push('Claim includes coordinates matching canonical record.');
      }
      if (!hasName && !hasCoord) {
        reasons.push('No location evidence found in canonical record.');
      }
    }

    // Attribute/description: verify mentioned tokens against known tags/name/category.
    if (claim.claimType === 'attribute' || claim.claimType === 'description') {
      const tagValues = Object.values(place.tags);
      const haystack = [place.name, place.nameLocal ?? '', place.category, ...Object.keys(place.tags), ...tagValues].join(' ');
      const words = normalize(claim.text)
        .split(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/)
        .filter((w) => w.length >= 3);
      const matched = words.filter((w) => normalize(haystack).includes(w));
      const ratio = words.length === 0 ? 0 : matched.length / Math.min(words.length, 12);
      score = Math.min(1, ratio * 1.2); // conservative boost, capped at 1
      if (matched.length > 0) {
        evidence.push(evidenceForPlace(place, 'tags', matched.slice(0, 8)));
        reasons.push(`Matched ${matched.length} claim tokens against canonical facts.`);
      } else {
        reasons.push('No claim tokens matched canonical source facts.');
      }
    }

    // Hours/route: require explicit structured evidence; default conservative.
    if (claim.claimType === 'hours' || claim.claimType === 'route') {
      score = 0;
      reasons.push(`${claim.claimType} claims require structured evidence; none provided.`);
    }

    const status = scoreToStatus(score);
    return {
      claimId: claim.id,
      status,
      confidence: Number(Math.min(1, Math.max(0, score)).toFixed(3)),
      reason: reasons.join(' '),
      matcher: 'rule',
      evidence,
      verifiedAt,
    };
  }
}

export class VerificationEngine {
  constructor(private readonly verifier: ClaimVerifier) {}

  async verifyClaims(inputs: ClaimVerificationInput[]): Promise<VerificationResult[]> {
    return Promise.all(inputs.map((input) => this.verifier.verify(input)));
  }

  summarize(results: VerificationResult[]) {
    return aggregateVerificationStatus(results);
  }
}

export function createDraftClaim(params: {
  itineraryVersionId: string;
  placeId: string | null;
  claimType: ClaimType;
  text: string;
  extractedBy?: 'rule' | 'llm' | 'hybrid';
}): Claim {
  return {
    id: randomUUID(),
    itineraryVersionId: params.itineraryVersionId,
    placeId: params.placeId,
    claimType: params.claimType,
    text: params.text,
    extractedBy: params.extractedBy ?? 'rule',
  };
}
