import db                       from '@DB';
import { advocates }            from '@DB/schema';
import { generateAdvocateData } from '@DB/seed/advocates';

export async function POST(req: Request) {
  // Allow dynamic seeding size via query param (?count=1000). Defaults to 1000.
  const url = new URL(req.url);
  const raw = Number(url.searchParams.get('count') || '1000');
  const count = Math.max(1, Math.min(10000, Number.isFinite(raw) ? Math.floor(raw) : 1000));
  const data = generateAdvocateData(count);
  const records = await (db as any).insert(advocates).values(data).returning();

  return Response.json({ inserted: records.length });
}
