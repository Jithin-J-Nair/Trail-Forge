import type { GenerateResponse } from '@trailforge/shared';

/** Compact fixture for scene rendering tests and local demos. */
export const SAMPLE_RESPONSE: GenerateResponse = {
  center: { lon: 139.7967, lat: 35.7148 },
  scene: {
    buildings: [
      {
        id: 'way/1',
        heightMeters: 12,
        footprint: [
          [-20, -20],
          [20, -20],
          [20, 20],
          [-20, 20],
        ],
      },
      {
        id: 'way/2',
        heightMeters: 24,
        footprint: [
          [40, -10],
          [70, -10],
          [70, 30],
          [40, 30],
        ],
      },
    ],
    roads: [
      {
        id: 'way/r1',
        kind: 'residential',
        points: [
          [-80, 0],
          [0, 0],
          [80, 40],
        ],
      },
    ],
  },
  pois: [
    {
      id: 'node/1',
      name: 'Senso-ji',
      lat: 35.7148,
      lon: 139.7967,
      category: 'attraction',
      osmTags: { name: 'Senso-ji', tourism: 'attraction' },
      x: 0,
      z: 0,
    },
    {
      id: 'node/2',
      name: 'Nakamise',
      lat: 35.7149,
      lon: 139.7965,
      category: 'gift',
      osmTags: { name: 'Nakamise', shop: 'gift' },
      x: 30,
      z: -15,
    },
  ],
  content: [
    {
      poiId: 'node/1',
      ja: [
        {
          text: '浅草寺は観光名所です。',
          sourceTags: [{ poiId: 'node/1', key: 'tourism' }],
        },
      ],
      en: [
        {
          text: 'Senso-ji is an attraction.',
          sourceTags: [{ poiId: 'node/1', key: 'tourism' }],
        },
      ],
      status: 'verified',
      issues: [],
    },
    {
      poiId: 'node/2',
      ja: [{ text: '仲見世通り。', sourceTags: [] }],
      en: [{ text: 'Nakamise street.', sourceTags: [] }],
      status: 'needs_review',
      issues: ['claim_missing_source_tags'],
    },
  ],
  route: {
    orderedPoiIds: ['node/1', 'node/2'],
    totalMeters: 120,
    estimatedMinutes: 15,
    titleJa: '浅草さんぽ',
    titleEn: 'Asakusa stroll',
  },
  verification: { verified: 1, needsReview: 1, rejected: 0, total: 2 },
};
