CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS center_geog geography(Point,4326);

UPDATE itineraries
SET center_geog = ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
WHERE center_geog IS NULL;

CREATE INDEX IF NOT EXISTS itineraries_center_geog_gist_idx
  ON itineraries USING GIST (center_geog);

CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_id text NOT NULL,
  name text NOT NULL,
  category text,
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  location geography(Point,4326) NOT NULL,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS places_location_gist_idx ON places USING GIST (location);
CREATE INDEX IF NOT EXISTS places_tags_gin_idx ON places USING GIN (tags);
