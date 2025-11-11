import type { Advocate }  from '@DB/schema';

import { and, or, eq, ilike, gte, lte, lt, desc, sql } from 'drizzle-orm';
import db                 from '@DB';
import { advocates }      from '@DB/schema';

// Server-side search + keyset pagination for large advocate dataset.
// - Query params: q, city, degree, specialty, minYears, maxYears, limit, cursor
// - Pagination: order by created_at DESC, id DESC; cursor format: "<tsMs>_<id>"
export async function GET(req: Request) {
  const url       = new URL(req.url);
  const q         = (url.searchParams.get('q') || '').trim();
  const city      = (url.searchParams.get('city') || '').trim();
  const degree    = (url.searchParams.get('degree') || '').trim();
  const specialty = (url.searchParams.get('specialty') || '').trim();
  const minYears  = url.searchParams.get('minYears');
  const maxYears  = url.searchParams.get('maxYears');
  const cursor    = url.searchParams.get('cursor') || '';

  const limitRaw = Number(url.searchParams.get('limit') || '50');
  const limit    = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));

  const filters: any[] = [];

  // Indexed-friendly filters
  if (city) filters.push(ilike(advocates.city, `%${city}%`));
  if (degree) filters.push(ilike(advocates.degree, `%${degree}%`));
  if (minYears && Number.isFinite(Number(minYears))) {
    filters.push(gte(advocates.yearsOfExperience, Number(minYears)));
  }
  if (maxYears && Number.isFinite(Number(maxYears))) {
    filters.push(lte(advocates.yearsOfExperience, Number(maxYears)));
  }
  if (specialty) {
    // Partial match on specialties via FTS (leveraging existing index) OR JSONB ILIKE on array elements.
    filters.push(sql<boolean>`
      (
        to_tsvector('english',
          coalesce(${advocates.firstName}, '') || ' ' ||
          coalesce(${advocates.lastName}, '')  || ' ' ||
          coalesce(${advocates.city}, '')      || ' ' ||
          coalesce(${advocates.degree}, '')    || ' ' ||
          coalesce(${advocates.specialties}::text, '')
        ) @@ plainto_tsquery('english', ${specialty})
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(${advocates.specialties}) AS elem(value)
          WHERE value ILIKE ${'%' + specialty + '%'}
        )
      )
    `);
  }

  if (q) {
    // Full-text search across core text fields + specialties (payload) with English stemming.
    const fts = sql<boolean>`
      to_tsvector('english',
        coalesce(${advocates.firstName}, '') || ' ' ||
        coalesce(${advocates.lastName}, '')  || ' ' ||
        coalesce(${advocates.city}, '')      || ' ' ||
        coalesce(${advocates.degree}, '')    || ' ' ||
        coalesce(${advocates.specialties}::text, '')
      ) @@ plainto_tsquery('english', ${q})
    `;
    filters.push(fts);
  }

  // Keyset cursor on (created_at,id) DESC
  let cursorPredicate: any | null = null;
  if (cursor) {
    const [tsStr, idStr] = cursor.split('_');
    const ts = Number(tsStr);
    const id = Number(idStr);
    if (Number.isFinite(ts) && Number.isFinite(id)) {
      const cursorDate = new Date(ts);
      cursorPredicate = or(
        lt(advocates.createdAt, cursorDate),
        and(eq(advocates.createdAt, cursorDate), lt(advocates.id, id))
      );
    }
  }

  const whereAll = filters.length
    ? (cursorPredicate ? and(and(...filters), cursorPredicate) : and(...filters))
    : (cursorPredicate ? cursorPredicate : undefined);

  const predicate = (whereAll as any) ?? sql<boolean>`true`;
  const rows: Advocate[] = await (db as any)
    .select()
    .from(advocates)
    .where(predicate)
    .orderBy(desc(advocates.createdAt), desc(advocates.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const data = hasNextPage ? rows.slice(0, limit) : rows;

  // Derive nextCursor from last row in page
  let nextCursor: string | null = null;
  if (hasNextPage) {
    const last = data[data.length - 1] as Advocate;
    const ts = last.createdAt ? new Date(last.createdAt as any).getTime() : 0;
    nextCursor = `${ts}_${last.id}`;
  }

  return Response.json(
    {
      data,
      pageInfo: {
        nextCursor,
        hasNextPage,
        limit
      }
    },
    {
      headers: {
        // Short CDN caching for repeated identical queries.
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
      }
    }
  );
}
