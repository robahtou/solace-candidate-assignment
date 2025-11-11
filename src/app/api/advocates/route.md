## Advocates API route (GET) — DB calls, transactions, and pagination

This document summarizes DB-call patterns and options for `src/app/api/advocates/route.ts`.

### Current behavior
- Two separate queries are executed:
  - `SELECT count(*) ...` for total rows after filters.
  - `SELECT ... LIMIT/OFFSET` for the current page.
- Not wrapped in a transaction → two independent round-trips and no guaranteed snapshot consistency between the count and the page when concurrent writes occur.

### Is this a single transaction?
- No. Each `await` is a separate statement/round-trip. There is no transaction unless explicitly started.

### Options

#### Option A — Keep two queries, wrap in a transaction (snapshot consistency)
- Pros: Simple, clear, guarantees the count and page rows come from the same snapshot.
- Cons: Still two queries; adds BEGIN/COMMIT overhead (usually negligible).

```ts
// Example sketch only
await db.transaction(async (tx) => {
  const totalRows = await (tx as any)
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(advocates)
    .where(predicate);

  const totalCount = totalRows?.[0]?.count ?? 0;

  const data: Advocate[] = await (tx as any)
    .select()
    .from(advocates)
    .where(predicate)
    .orderBy(desc(advocates.createdAt), desc(advocates.id))
    .limit(limit)
    .offset(offset);
});
```

#### Option B — Single round-trip using a window function
- Pros: One SQL statement/round-trip; inherent consistency.
- Cons: Slightly more complex result shaping; `count(*) over()` still computes the same count as a standalone `count(*)` (no free lunch).

```ts
// Example sketch only
const rows = await (db as any)
  .select({
    id: advocates.id,
    firstName: advocates.firstName,
    lastName: advocates.lastName,
    city: advocates.city,
    degree: advocates.degree,
    specialties: advocates.specialties,
    yearsOfExperience: advocates.yearsOfExperience,
    phoneNumber: advocates.phoneNumber,
    createdAt: advocates.createdAt,
    totalCount: sql<number>`count(*) over ()`.mapWith(Number)
  })
  .from(advocates)
  .where(predicate)
  .orderBy(desc(advocates.createdAt), desc(advocates.id))
  .limit(limit)
  .offset(offset);

const totalCount = rows[0]?.totalCount ?? 0;
const data: Advocate[] = rows.map(({ totalCount, ...rest }) => rest as Advocate);
```

### Recommendations
- If you want correctness and simplicity: use Option A (transaction). This prevents count/page mismatch under concurrent writes.
- If you want to reduce network overhead and are comfortable with a slightly more complex select: use Option B (window function).
- Leaving as-is is acceptable if occasional small inconsistencies between count and page are tolerable and simplicity is paramount.

### Performance notes and indexing
- Ensure an index that supports the sort: `(created_at DESC, id DESC)` (or at least `(created_at, id)`), to keep `ORDER BY ... LIMIT` fast.
- Filters already leverage indexes where available (`city`, `degree`, numeric ranges), and FTS/JSONB options exist for `specialties`.
- `count(*)` on large filtered sets can be expensive regardless of strategy. For very large datasets, consider:
  - Approximate counts (e.g., cached totals, ANALYZE estimates) if exact page numbers aren’t mandatory.
  - Cursor-based pagination if numbered pagination can be relaxed (not compatible with numbered UI without additional work).

### TL;DR
- Today: two round-trips, no transaction.
- Use a transaction for snapshot consistency (Option A), or use a single-query with `count(*) over()` (Option B) to cut one round-trip.
