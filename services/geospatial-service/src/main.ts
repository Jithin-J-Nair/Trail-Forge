/**
 * Geospatial Service scaffold.
 * Responsibilities: OSM/Overpass ingestion, Nominatim geocoding, canonical place
 * resolution, PostGIS spatial search, place snapshots/provenance.
 */
export interface GeospatialServiceConfig {
  overpassUrl: string;
  nominatimUrl: string;
  postgisUrl: string;
}

export function createGeospatialService(config: GeospatialServiceConfig) {
  return { config, status: 'scaffold' };
}
