## Solace Candidate Assignment

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Install dependencies

```bash
pnpm i
```

Run the development server:

```bash
pnpm dev
```

## Database set up

The app is configured to return a default list of advocates. This will allow you to get the app up and running without needing to configure a database. If you’d like to configure a database, you’re encouraged to do so. You can uncomment the url in `.env` and the line in `src/app/api/advocates/route.ts` to test retrieving advocates from the database.

1. Feel free to use whatever configuration of postgres you like. The project is set up to use docker-compose.yml to set up postgres. The url is in .env.

```bash
docker compose up -d
```

2. Push migration to the database

> NOTE: must set `DATABASE_URL` in `.env` before running migrations

```bash
npx drizzle-kit push
```

3. Seed the database

> NOTE: assumes your are running the development server (see above)

```bash
curl -X POST http://localhost:3000/api/seed
```
