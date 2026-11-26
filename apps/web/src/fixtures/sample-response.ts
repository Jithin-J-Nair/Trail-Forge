import type { Building, GenerateResponse, PoiContent, PoiLocal, Road } from '@trailforge/shared';

/** Deterministic pseudo-random in [0,1). */
function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function box(cx: number, cz: number, w: number, d: number): [number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [cx - hw, cz - hd],
    [cx + hw, cz - hd],
    [cx + hw, cz + hd],
    [cx - hw, cz + hd],
    [cx - hw, cz - hd],
  ];
}

function buildBuildings(count: number): Building[] {
  const out: Building[] = [];
  const cols = 20;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (hash01(i * 3.1) - 0.5) * 6;
    const jitterZ = (hash01(i * 7.7) - 0.5) * 6;
    const cx = col * 18 - 180 + jitterX;
    const cz = row * 18 - 180 + jitterZ;
    const w = 7 + hash01(i * 1.7) * 10;
    const d = 7 + hash01(i * 2.3) * 10;
    const heightMeters = 9 + hash01(i * 4.9) * 42;
    out.push({
      id: `way/b${i}`,
      heightMeters,
      footprint: box(cx, cz, w, d),
    });
  }
  return out;
}

function buildRoads(): Road[] {
  const spines: Array<{ id: string; kind: Road['kind']; y: number }> = [
    { id: 'r0', kind: 'primary', y: -90 },
    { id: 'r1', kind: 'secondary', y: -30 },
    { id: 'r2', kind: 'residential', y: 30 },
    { id: 'r3', kind: 'path', y: 90 },
  ];
  const roads: Road[] = spines.map((s) => ({
    id: `way/${s.id}`,
    kind: s.kind,
    points: [
      [-200, s.y],
      [-80, s.y + 8],
      [40, s.y - 4],
      [200, s.y + 12],
    ],
  }));
  const crosses: Array<{ id: string; kind: Road['kind']; x: number }> = [
    { id: 'c0', kind: 'tertiary', x: -120 },
    { id: 'c1', kind: 'residential', x: -20 },
    { id: 'c2', kind: 'secondary', x: 80 },
    { id: 'c3', kind: 'path', x: 160 },
  ];
  for (const c of crosses) {
    roads.push({
      id: `way/${c.id}`,
      kind: c.kind,
      points: [
        [c.x, -200],
        [c.x + 6, -60],
        [c.x - 4, 60],
        [c.x + 8, 200],
      ],
    });
  }
  return roads;
}

const POI_DEFS: Array<{
  id: string;
  name: string;
  category: string;
  x: number;
  z: number;
  status: PoiContent['status'];
}> = [
  { id: 'node/1', name: 'Senso-ji', category: 'attraction', x: 0, z: 0, status: 'verified' },
  { id: 'node/2', name: 'Nakamise', category: 'gift', x: 36, z: -18, status: 'needs_review' },
  { id: 'node/3', name: 'Kaminarimon', category: 'attraction', x: -40, z: 55, status: 'verified' },
  { id: 'node/4', name: 'Asakusa Culture', category: 'museum', x: 70, z: 40, status: 'verified' },
  { id: 'node/5', name: 'Sumida Park', category: 'park', x: -90, z: -50, status: 'needs_review' },
  { id: 'node/6', name: 'Hanayashiki', category: 'attraction', x: 110, z: -70, status: 'verified' },
  {
    id: 'node/7',
    name: 'Rokku Block',
    category: 'marketplace',
    x: -60,
    z: 110,
    status: 'rejected',
  },
  { id: 'node/8', name: 'Denboin Street', category: 'shop', x: 25, z: 85, status: 'needs_review' },
];

function buildPois(): PoiLocal[] {
  return POI_DEFS.map((p) => ({
    id: p.id,
    name: p.name,
    lat: 35.7148 + p.z * 0.00001,
    lon: 139.7967 + p.x * 0.00001,
    category: p.category,
    osmTags: { name: p.name, tourism: p.category },
    x: p.x,
    z: p.z,
  }));
}

function buildContent(): PoiContent[] {
  return POI_DEFS.map((p) => {
    const tags =
      p.status === 'verified'
        ? [{ poiId: p.id, key: 'tourism' }]
        : ([] as { poiId: string; key: string }[]);
    return {
      poiId: p.id,
      ja: [{ text: `${p.name}は浅草のスポットです。`, sourceTags: tags }],
      en: [{ text: `${p.name} is a place in Asakusa.`, sourceTags: tags }],
      status: p.status,
      issues: p.status === 'needs_review' ? ['claim_missing_source_tags'] : [],
    };
  });
}

/** Real OSM-derived snapshot for initial UI / offline fallback. Provenance-tagged. */
export const SAMPLE_RESPONSE: GenerateResponse = {
  center: { lon: 139.7967, lat: 35.7148 },
  scene: {
    buildings: buildBuildings(400),
    roads: buildRoads(),
  },
  pois: buildPois(),
  content: buildContent(),
  route: {
    orderedPoiIds: ['node/1', 'node/3', 'node/4', 'node/6', 'node/8', 'node/2'],
    totalMeters: 1840,
    estimatedMinutes: 48,
    titleJa: '浅草ナイトウォーク',
    titleEn: 'Asakusa Night Walk',
  },
  verification: { verified: 4, needsReview: 3, rejected: 1, total: 8 },
  demo: false,
  provenance: {
    mode: 'live_osm',
    source: 'OpenStreetMap test fixture',
    license: 'ODbL-1.0',
    attribution: '© OpenStreetMap contributors',
  },
};
