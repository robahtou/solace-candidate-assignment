<!-- Seeding is intended for local/dev usage to quickly populate the advocates table for demo, search, and UI testing. -->

## Seeding overview
This directory provides utilities to generate and insert realistic fake data into the `advocates` table using `@faker-js/faker` and Drizzle ORM. You can seed via:
- CLI runner for bulk/local development
- HTTP API route for quick inserts during app runtime

### What's here
- `src/db/seed/advocates.ts`
  - Exposes `generateAdvocateData(count)` which returns an array of rows with fields: `firstName`, `lastName`, `city`, `degree`, `specialties` (string[]), `yearsOfExperience`, `phoneNumber`.
  - Contains curated `SPECIALTIES` and `DEGREES` lists for realistic distributions.
- `src/db/seed/index.ts`
  - CLI entrypoint. Parses `--count` and `--truncate` flags, batches inserts (size 1000), and requires `DATABASE_URL`.
- `src/app/api/seed/route.ts`
  - HTTP `POST /api/seed?count=1000` endpoint. Generates and inserts up to 10,000 rows per request. Returns `{ inserted: number }`.

## How to run

### Prerequisites
- Ensure the database is reachable and `DATABASE_URL` is set in `.env`.
- Make sure the schema/migrations have been applied:

```bash
pnpm generate
pnpm migrate:up
```

### Option 1: CLI (recommended for bulk)
- Defaults to inserting 5,000 rows. Use `--count` to customize and `--truncate` to clear the table first.

```bash
# default: 5,000 rows
pnpm seed

# custom count
pnpm seed -- --count=10000

# start from a clean table then seed
pnpm seed -- --truncate --count=8000
```

Notes:
- `--truncate` is destructive; it deletes existing `advocates` rows before inserting.
- Inserts are batched in chunks of 1000 for performance.

### Option 2: HTTP API (quick, ad-hoc)
1) Start the dev server:
```bash
pnpm start
```
2) Seed via HTTP (default 1000, min 1, max 10000):
```bash
curl -X POST 'http://localhost:3000/api/seed?count=1500'
# -> {"inserted":1500}
```

Notes:
- The API route always appends records (no truncate). Use the CLI when you need a clean slate.

## Data model summary
- Table: `advocates`
- Columns (selected): `first_name`, `last_name`, `city`, `degree`, `payload` (JSONB specialties), `years_of_experience`, `phone_number`, `created_at`.
- See `src/db/schema.ts` for exact column definitions.

## Limits, defaults, and safety
- CLI default: `--count=5000`. API default: `?count=1000`.
- API clamps `count` between 1 and 10,000 to avoid accidental overloads.
- The generated data is entirely synthetic; suitable for demos and local/dev testing only.

## Troubleshooting
- If you see "DATABASE_URL is not set", add it to `.env` and re-run.
- If inserts fail due to missing tables/columns, run migrations with `pnpm migrate:up`.
- Large counts will take longer; prefer the CLI for high volume.
