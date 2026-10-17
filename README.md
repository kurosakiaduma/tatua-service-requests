# Tatua

Tatua ("resolve" in Swahili) is a mini eCitizen-style public service request
system. Citizens can report a broken streetlight, water issue, road problem,
garbage collection problem, sewage issue, or another local concern and follow
its status through resolution.

## Features

- Email/password citizen registration and login.
- Request submission with category, location, description, and optional image.
- Private Supabase Storage uploads restricted to image files up to 5 MB.
- Citizen-only request visibility enforced by server authorization and RLS.
- Admin dashboard with open/resolved analytics and status updates.
- Status history recorded by database triggers.
- Responsive, keyboard-friendly UI with reusable status badges and clear
  loading, empty, and error states.
- Daily Vercel cron request to `/api/health` to keep the free Supabase project
  active.

## Architecture

The application uses Next.js App Router and server actions. `src/app/actions.ts`
contains mutations; validation is centralized in `src/lib/validations.ts`; the
Supabase SSR client is in `src/lib/supabase/server.ts`; and the service-role
client is isolated in `src/lib/supabase/admin.ts` for the health route.

The database is the authorization boundary:

| Table | Purpose |
| --- | --- |
| `profiles` | User name and `citizen`/`admin` role |
| `requests` | Citizen report, category, location, description, image, status |
| `status_history` | Immutable status transition timeline |
| `healthcheck` | Trivial database query used by uptime checks |

Migrations in `supabase/migrations` are the single source of truth. RLS uses
the `is_admin()` security-definer helper to avoid trusting client-supplied
roles. The service role key is never sent to the browser.

## Local setup

1. Install Node.js 22 or newer and the Supabase CLI.
2. Clone this repository and install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

4. Set the three values in `.env.local`:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

   Never commit `.env.local` or expose the service role key as a
   `NEXT_PUBLIC_` variable.

5. Link the Supabase CLI to the intended project, then apply migrations:

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

6. Create demo data:

   ```bash
   npm run seed
   ```

7. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Demo credentials

The seed script creates these accounts with email confirmation already
verified:

- Admin: `admin@tatua.demo` / `TatuaDemo123!`
- Citizen: `citizen@tatua.demo` / `TatuaDemo123!`

Run `npm run seed` only against the intended project. It is idempotent for the
demo users and creates sample requests only when the demo citizen has none.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs all four checks on every push and pull request.

## Deployment

The repository is designed for Vercel Hobby with the existing Supabase project:

1. Import the public GitHub repository into Vercel.
2. Add the three environment variables for Preview and Production.
3. Deploy the `main` branch.
4. Confirm `/api/health` returns `{"ok":true}`.

The daily cron is configured in [vercel.json](./vercel.json). Add the final
production URL here after the Vercel project is created:

```text
Live URL: [Tatua Service Requests](https://tatua-service-requests.vercel.app/)
```

## Screenshots

Screenshots can be added here after the production deployment is available.
