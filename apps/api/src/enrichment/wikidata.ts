import { z } from 'zod';

const WIKIDATA_ENTITY_URL = 'https://www.wikidata.org/wiki/Special:EntityData';

export type WikidataEnrichment = {
  qid: string;
  label?: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
};

const entitySchema = z.object({
  entities: z.record(
    z.object({
      labels: z.record(z.object({ value: z.string() })).optional(),
      descriptions: z.record(z.object({ value: z.string() })).optional(),
      claims: z
        .record(
          z.array(
            z.object({
              mainsnak: z
                .object({
                  datavalue: z.object({ value: z.any() }).optional(),
                })
                .optional(),
            }),
          ),
        )
        .optional(),
    }),
  ),
});

export async function fetchWikidataEntity(
  qid: string,
  options: { fetchImpl?: typeof fetch; signal?: AbortSignal; lang?: string } = {},
): Promise<WikidataEnrichment | null> {
  if (!/^Q\d+$/.test(qid)) return null;
  const fetchImpl = options.fetchImpl ?? fetch;
  const lang = options.lang ?? 'en';
  const url = `${WIKIDATA_ENTITY_URL}/${qid}.json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TrailForge/0.1 (geospatial verification)',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = entitySchema.safeParse(await res.json());
    if (!json.success) return null;
    const entity = json.data.entities[qid];
    if (!entity) return null;
    const label = entity.labels?.[lang]?.value ?? entity.labels?.['en']?.value;
    const description = entity.descriptions?.[lang]?.value ?? entity.descriptions?.['en']?.value;
    const imageClaim = entity.claims?.['P18']?.[0]?.mainsnak?.datavalue?.value;
    const imageUrl =
      typeof imageClaim === 'string'
        ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageClaim)}`
        : undefined;
    return {
      qid,
      ...(label ? { label } : {}),
      ...(description ? { description } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
