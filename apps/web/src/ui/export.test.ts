import { describe, expect, it } from 'vitest';
import { SAMPLE_RESPONSE } from '../fixtures/sample-response.js';
import { buildCsv, buildGeoJson } from './export.js';

describe('export builders', () => {
  it('exports verified items as GeoJSON FeatureCollection', () => {
    const json = JSON.parse(buildGeoJson(SAMPLE_RESPONSE, SAMPLE_RESPONSE.content, 'Asakusa'));
    expect(json.type).toBe('FeatureCollection');
    expect(json.metadata.license).toBe('ODbL');
    expect(json.features.length).toBe(4);
  });

  it('CSV includes UTF-8 BOM and metadata', () => {
    const csv = buildCsv(SAMPLE_RESPONSE, SAMPLE_RESPONSE.content, 'Asakusa');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('OpenStreetMap');
    expect(csv).toContain('Senso-ji');
  });
});
