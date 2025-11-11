import type { Advocate }  from '@DB/schema';

import { and, ilike, gte, lte, desc, sql } from 'drizzle-orm';
import db                 from '@DB';
import { advocates }      from '@DB/schema';

// Switched to page/limit pagination to support numbered pagination UI.
// If dataset grows large, consider hybrid cursor navigation with a cached total.
export async function GET(req: Request) {
  const url       = new URL(req.url);
  const q         = (url.searchParams.get('q') || '').trim();
  const city      = (url.searchParams.get('city') || '').trim();
  const degree    = (url.searchParams.get('degree') || '').trim();
  const specialty = (url.searchParams.get('specialty') || '').trim();
  const minYears  = url.searchParams.get('minYears');
  const maxYears  = url.searchParams.get('maxYears');

  const pageRaw  = Number(url.searchParams.get('page') || '1');
  const limitRaw = Number(url.searchParams.get('limit') || '15');
  const page     = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit    = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 15));
  const offset   = (page - 1) * limit;

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

  const predicate = filters.length ? and(...filters) : sql<boolean>`true`;

  // Total count to compute total pages
  const totalRows = await (db as any)
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(advocates)
    .where(predicate);
  const totalCount = totalRows?.[0]?.count ?? 0;

  const data: Advocate[] = await (db as any)
    .select()
    .from(advocates)
    .where(predicate)
    .orderBy(desc(advocates.createdAt), desc(advocates.id))
    .limit(limit)
    .offset(offset);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return Response.json(
    {
      data,
      pageInfo: {
        page,
        pageSize: limit,
        totalCount,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
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
