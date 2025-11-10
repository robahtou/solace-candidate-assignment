import type { Advocate }  from '@DB/schema';

import db                 from '@DB';
import { advocates }      from '@DB/schema';

export async function GET() {
  console.log(['GET /api/advocates']);
  const data: Advocate[] = await db.select().from(advocates);

  return Response.json({ data });
}
