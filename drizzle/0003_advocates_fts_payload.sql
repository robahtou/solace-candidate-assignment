-- Extend FTS to include specialties (payload) and switch to English stemming.
-- New GIN index covers: first_name, last_name, city, degree, payload::text
CREATE INDEX IF NOT EXISTS idx_advocates_fts_english_v2 ON advocates
USING GIN (
  to_tsvector(
    'english',
    coalesce(first_name, '') || ' ' ||
    coalesce(last_name, '')  || ' ' ||
    coalesce(city, '')       || ' ' ||
    coalesce(degree, '')     || ' ' ||
    coalesce(payload::text, '')
  )
);

-- Optional: drop the older simple dictionary index if present.
DROP INDEX IF EXISTS idx_advocates_fts_simple;
