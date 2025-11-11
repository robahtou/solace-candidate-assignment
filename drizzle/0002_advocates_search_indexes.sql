-- Indexes to support scalable search and keyset pagination on advocates.
-- - Keyset pagination over (created_at, id)
-- - JSONB containment on payload (specialties)
-- - Full-text search across first_name, last_name, city, degree
-- - Optional trigram indexes for ILIKE (requires pg_trgm)

-- Optional: enable pg_trgm for trigram indexes (may require superuser privileges)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE EXTENSION pg_trgm;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Skip extension creation if privileges are insufficient.
    NULL;
END $$;

-- Keyset pagination compound index
CREATE INDEX IF NOT EXISTS idx_advocates_created_at_id
  ON advocates (created_at DESC, id DESC);

-- JSONB payload containment (specialties)
CREATE INDEX IF NOT EXISTS idx_advocates_payload_gin
  ON advocates USING GIN (payload);

-- Full text search index (simple dictionary) over core fields
CREATE INDEX IF NOT EXISTS idx_advocates_fts_simple
  ON advocates USING GIN (
    to_tsvector(
      'simple',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '')  || ' ' ||
      coalesce(city, '')       || ' ' ||
      coalesce(degree, '')
    )
  );

-- Optional trigram indexes for faster ILIKE (no-op if pg_trgm missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_advocates_first_name_trgm ON advocates USING GIN (first_name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_advocates_last_name_trgm  ON advocates USING GIN (last_name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_advocates_city_trgm       ON advocates USING GIN (city gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_advocates_degree_trgm     ON advocates USING GIN (degree gin_trgm_ops);
  END IF;
END $$;

-- Years filter (optional helper)
CREATE INDEX IF NOT EXISTS idx_advocates_years ON advocates (years_of_experience);
