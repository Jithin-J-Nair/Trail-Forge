import { z } from 'zod';

export type WikipediaSummary = {
  title: string;
  extract?: string;
  url: string;
  lang: string;
};

const summarySchema = z.object({
  title: z.string(),
  extract: z.string().optional(),
  content_urls: z.object({
    desktop: z.object({ page: z.string().url() }).optional(),
  }).optional(),
});

export async function fetchWikipediaSummary(
  title: string,
  options: { fetchImpl?: typeof fetch; signal?: AbortSignal; lang?: string } = {},
): Promise<WikipediaSummary | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const lang = options.lang ?? 'en';
  const normalized = title.replace(/^https?:\/\/[a-z.]+\/wiki\//, '').replace(/ /g, '_');
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalized)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'TrailForge/0.1 (geospatial verification)' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = summarySchema.safeParse(await res.json());
    if (!json.success) return null;
    return {
      title: json.data.title,
      ...(json.data.extract ? { extract: json.data.extract } : {}),
      url: json.data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(normalized)}`,
      lang,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
