import { describe, expect, it } from 'vitest';
import { RuleBasedClaimVerifier, VerificationEngine, createDraftClaim } from './verification-engine.js';
import type { CanonicalPlace } from './place.js';

const place: CanonicalPlace = {
  id: '11111111-1111-4111-8111-111111111111',
  canonicalSource: 'osm',
  canonicalSourceId: 'node/123',
  name: 'Senso-ji',
  nameLocal: '浅草寺',
  category: 'temple',
  tags: { historic: 'temple', name: 'Senso-ji', 'name:ja': '浅草寺', tourism: 'attraction' },
  location: { lat: 35.7148, lng: 139.7967 },
  confidence: 0.99,
  sources: [{ sourceType: 'osm', sourceId: 'node/123', fetchedAt: new Date().toISOString() }],
  lastVerifiedAt: new Date().toISOString(),
};

describe('RuleBasedClaimVerifier', () => {
  it('verifies existence claims for canonical places', async () => {
    const verifier = new RuleBasedClaimVerifier();
    const claim = createDraftClaim({
      itineraryVersionId: '22222222-2222-4222-8222-222222222222',
      placeId: place.id,
      claimType: 'existence',
      text: 'Senso-ji exists in Asakusa.',
    });
    const result = await verifier.verify({ claim, place });
    expect(result.status).toBe('VERIFIED');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('marks unsupported claims as NEEDS_REVIEW when no place', async () => {
    const verifier = new RuleBasedClaimVerifier();
    const claim = createDraftClaim({
      itineraryVersionId: '22222222-2222-4222-8222-222222222222',
      placeId: null,
      claimType: 'description',
      text: 'A magical temple built in 1600 by dragons.',
    });
    const result = await verifier.verify({ claim, place: null });
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.confidence).toBe(0);
  });

  it('aggregates summary conservatively', async () => {
    const engine = new VerificationEngine(new RuleBasedClaimVerifier());
    const claims = [
      createDraftClaim({
        itineraryVersionId: '22222222-2222-4222-8222-222222222222',
        placeId: place.id,
        claimType: 'existence',
        text: 'Senso-ji is a temple.',
      }),
      createDraftClaim({
        itineraryVersionId: '22222222-2222-4222-8222-222222222222',
        placeId: null,
        claimType: 'description',
        text: 'Unknown place.',
      }),
    ];
    const results = await engine.verifyClaims(claims.map((claim) => ({ claim, place: claim.placeId ? place : null })));
    const summary = engine.summarize(results);
    expect(summary.counts.needsReview).toBe(1);
    expect(summary.overallStatus).toBe('NEEDS_REVIEW');
  });
});
