import type { GenerateResponse, PoiContent, PoiLocal } from '@trailforge/shared';

export type ApprovedContent = PoiContent & { humanReviewed?: boolean };

function exportable(content: ApprovedContent[]): ApprovedContent[] {
  return content.filter((c) => c.status === 'verified' || c.humanReviewed);
}

export function buildGeoJson(
  response: GenerateResponse,
  content: ApprovedContent[],
  area: string,
): string {
  const allowed = new Set(exportable(content).map((c) => c.poiId));
  const features = response.pois
    .filter((p) => allowed.has(p.id))
    .map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        osmTags: p.osmTags,
      },
    }));

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      metadata: {
        generatedAt: new Date().toISOString(),
        area,
        source: 'OpenStreetMap',
        license: 'ODbL',
      },
      features,
    },
    null,
    2,
  );
}

export function buildCsv(
  response: GenerateResponse,
  content: ApprovedContent[],
  area: string,
): string {
  const byId = new Map(content.map((c) => [c.poiId, c]));
  const rows = [['id', 'name', 'lon', 'lat', 'category', 'status', 'en', 'ja']];
  for (const p of response.pois) {
    const c = byId.get(p.id);
    if (!c || (c.status !== 'verified' && !(c as ApprovedContent).humanReviewed)) continue;
    rows.push([
      p.id,
      p.name,
      String(p.lon),
      String(p.lat),
      p.category,
      c.status,
      c.en.map((x) => x.text).join(' '),
      c.ja.map((x) => x.text).join(' '),
    ]);
  }
  const bom = '\uFEFF';
  const body = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  return `${bom}# area=${area}; generatedAt=${new Date().toISOString()}; source=OpenStreetMap; license=ODbL\n${body}\n`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportFilename(area: string, ext: string): string {
  const safe =
    area
      .trim()
      .replace(/[^\w.-]+/g, '_')
      .slice(0, 40) || 'tour';
  const day = new Date().toISOString().slice(0, 10);
  return `trailforge_${safe}_${day}.${ext}`;
}

export function poiLabel(poi: PoiLocal): string {
  return poi.name;
}
