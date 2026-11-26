CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query text NOT NULL,
  theme text NOT NULL,
  duration_minutes int NOT NULL,
  radius_meters int NOT NULL,
  center_lon double precision NOT NULL,
  center_lat double precision NOT NULL,
  center_display_name text,
  response jsonb NOT NULL,
  verification_summary jsonb NOT NULL,
  provenance jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS itineraries_user_id_created_at_idx
  ON itineraries (user_id, created_at DESC);
