# Tatua

Tatua ("resolve" in Swahili) is a mini eCitizen-style public service request
system. Citizens can report a broken streetlight, water issue, road problem,
garbage collection problem, sewage issue, or another local concern and follow
its status through resolution.

## Features

- Email/password citizen registration and login.
- Request submission with category, location, description, optional image, and a
  Murang'a map pin.
- Private Supabase Storage uploads restricted to image files up to 5 MB.
- Citizen-only request visibility enforced by server authorization and RLS.
- Admin dashboard with open/resolved/rejected analytics and status updates.
- An atomic, append-only status timeline records the time, status, message and
  authenticated administrator for every update. Citizens see the actor as the
  service team.
- Duplicate reports remain visible as linked reports with a public reference
  such as `TAT-000123`; they follow the original report's status without
  inflating primary-request analytics.
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
| `requests` | Citizen report, category, location, coordinates, description, image, status |
| `status_history` | Timeline entries with status, optional message and acting admin |
| `healthcheck` | Trivial database query used by uptime checks |

Migrations in `supabase/migrations` are the single source of truth. RLS uses
the `is_admin()` security-definer helper to avoid trusting client-supplied
roles. The service role key is never sent to the browser.

Rejected requests require a reason of at least ten characters. Resolved and
rejected requests are final until an administrator reopens them to in progress
with a message. Duplicate reports expose only the duplicate explanation, never
another citizen's private data; linked reports expose their own details and a
narrow public view of the original. Private images are stored under the submitting
user's UUID and are served with short-lived signed URLs.

Every request gets a unique `TAT-######` reference. Administrators link an
unlinked report to an existing primary report through atomic database functions.
The linked report keeps its own description, image and citizen visibility,
follows the original status (including rejection and reopening), and can later
be unlinked back to Pending. Database constraints reject chains, self-links and
second links.

Citizens never receive another citizen's row, image, or raw timeline through
RLS. A linked citizen can call only a narrow security-definer function for the
original's reference, category, location, coordinates, status, created date
and public timeline. Descriptions, images, reporter identity and other linked
reports are excluded.

Maps use Leaflet and OpenStreetMap tiles without an API key. The map defaults to
Murang'a town (approximately -0.72, 37.15). Place search uses Kenya-restricted
Nominatim requests only after an explicit submit, with caching and a one-request
per-second limit. Attribution is shown on every map, as required by the
OpenStreetMap and Nominatim usage policies.

Location text and the map pin stay synchronized in both directions. Dropping,
dragging, searching, or using the current location reverse-geocodes an address
when possible, while preserving text the citizen typed and offering a
confirmation before replacing it. Enter or **Find on map** geocodes only on
explicit submit; an empty result leaves the text unchanged. The expanded map
dialog has Confirm and Cancel so an exploratory pin can be discarded. Request
photos are resized in the browser to a maximum 1600 pixels on the long edge
and compressed before upload; the lightbox uses signed URLs and no paid image
transformations.

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

Refresh screenshots after the production smoke test and add the citizen
expanded-map view, citizen linked-report timeline, and admin linked-reports
panel here. No image assets are checked in until that smoke test is complete.
