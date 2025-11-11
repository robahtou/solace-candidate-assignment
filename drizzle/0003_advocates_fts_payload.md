### 0003_advocates_fts_payload — what this migration does and why

This migration upgrades full‑text search (FTS) for advocates and broadens searchable data:

- Creates a new GIN FTS index using the `english` dictionary over `first_name`, `last_name`, `city`, `degree`, and `payload::text` (specialties and other attributes). This consolidates core fields and JSONB payload into one searchable vector.
- Drops the older `simple` dictionary FTS index to avoid redundant maintenance and planner confusion.

Why these choices:

- The `english` dictionary adds stemming and token normalization (e.g., 'surgery' ↔ 'surgeon'), improving recall and ranking for user queries compared to `simple`.
- Including `payload::text` brings specialties and other structured attributes into FTS, so users can find advocates by specialty keywords without separate JSONB containment filters.
- Maintaining a single FTS index reduces write overhead and keeps the query planner’s options clear.

Operational notes:

- Creation is idempotent via `CREATE INDEX IF NOT EXISTS`; the old index is dropped with `DROP INDEX IF EXISTS`.
- For very large tables, consider `CREATE INDEX CONCURRENTLY` executed outside a transaction to reduce locks.
- Querying recommendations: prefer `websearch_to_tsquery('english', q)` or `plainto_tsquery('english', q)` to align with the index dictionary.
