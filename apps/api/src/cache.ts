import { LRUCache } from 'lru-cache';

/** Shared response cache shell for later Overpass/Nominatim use. */
export const responseCache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 15,
});
