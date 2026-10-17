# Tatua

Tatua ("resolve" in Swahili) is a public service request system for reporting
issues such as broken streetlights, water interruptions, and garbage collection.
The application is being built with Next.js, TypeScript, Tailwind CSS, and
Supabase.

## Step 1 skeleton

The initial skeleton includes:

- A Next.js App Router application in strict TypeScript.
- A server-only Supabase client.
- A database-backed `GET /api/health` endpoint.
- A Supabase migration that creates the non-destructive healthcheck table.

Run the application locally:

```bash
npm install
cp .env.example .env.local
# Set the Supabase values in .env.local.
npm run dev
```

The health endpoint is available at
[`http://localhost:3000/api/health`](http://localhost:3000/api/health).
It returns `{"ok":true}` when the configured Supabase database is reachable.

## Environment variables

See [.env.example](./.env.example). The service role key is server-only and must
never be exposed through a `NEXT_PUBLIC_` variable or committed to git.

## Development commands

```bash
npm run lint
npm run build
supabase db push
```

Feature implementation, testing, deployment, and the complete setup guide will
be documented here as the project progresses.
