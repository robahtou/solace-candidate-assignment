### 0002_advocates_search_indexes — what this migration does and why

This migration creates the indexes needed to make advocate search and pagination fast and scalable:

- Enables `pg_trgm` extension when possible (guarded): allows trigram indexes that speed up `ILIKE`/substring searches. Skips silently if privileges are insufficient.
- Adds a composite btree index on `(created_at DESC, id DESC)`: enables efficient keyset (seek) pagination without `OFFSET`, keeping pagination stable and fast as the table grows.
- Adds a GIN index on the JSONB `payload`: accelerates containment queries (e.g., `payload @> ...`) used for filtering by specialties and other structured attributes.
- Adds a GIN full‑text search index (simple dictionary) over `first_name`, `last_name`, `city`, and `degree`: enables fast, ranked text search using `to_tsvector('simple', ...)` across the key user‑facing fields.
- Conditionally adds trigram GIN indexes on `first_name`, `last_name`, `city`, and `degree` (only if `pg_trgm` exists): speeds up `ILIKE` and partial‑match queries as a pragmatic fallback or complement to FTS.
- Adds a btree index on `years_of_experience`: speeds up equality/range filters on years when searching/browsing.

Why these choices:

- Keyset pagination avoids the performance pitfalls and instability of `OFFSET/LIMIT` on large datasets.
- JSONB GIN is the standard way to accelerate `@>`/key/array operators on semi‑structured attributes like specialties.
- Full‑text search provides better relevance and faster lookups than raw `ILIKE`; the `simple` dictionary avoids aggressive stemming that can distort names.
- Trigram indexes make prefix/substring lookups responsive when FTS is not appropriate or when the UI uses partial text filters.
- Targeted indexes like `years_of_experience` help common filter paths remain snappy without scanning.

Operational notes:

- All `CREATE` statements are `IF NOT EXISTS` for idempotency across environments.
- Extension creation is wrapped in a `DO` block and will skip if lacking privileges.
- Index builds may lock the table; for very large datasets consider `CREATE INDEX CONCURRENTLY` (which requires executing outside a transaction).
