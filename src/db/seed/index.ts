import 'dotenv/config';

import db from '../index';
import { advocates } from '../schema';
import { generateAdvocateData } from './advocates';

// CLI seed runner.
// Usage:
//   pnpm seed -- --count=5000
//   pnpm seed -- --count=10000 --truncate

type SeedArgs = {
  count: number;
  truncate: boolean;
};

function parseArgs(argv: string[]): SeedArgs {
  const args = { count: 5000, truncate: false };
  for (const part of argv.slice(2)) {
    if (part.startsWith('--count=')) {
      const raw = Number(part.split('=')[1]);
      if (Number.isFinite(raw) && raw > 0) args.count = Math.floor(raw);
    } else if (part === '--truncate') {
      args.truncate = true;
    }
  }
  return args;
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const { count, truncate } = parseArgs(process.argv);
  const BATCH_SIZE = 1000;

  if (truncate) {
    // Clear existing rows before seeding when --truncate is provided.
    await (db as any).delete(advocates);
    console.log('Truncated advocates table.');
  }

  let remaining = count;
  let inserted = 0;
  while (remaining > 0) {
    const size = Math.min(BATCH_SIZE, remaining);
    const rows = generateAdvocateData(size);
    const res = await (db as any).insert(advocates).values(rows).returning();
    inserted += res.length;
    remaining -= size;
    console.log(`Inserted ${inserted}/${count}...`);
  }

  console.log(`Done. Inserted ${inserted} advocates.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
