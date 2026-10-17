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

### Application architecture

```mermaid
flowchart LR
    Citizen[Citizen browser] -->|Server actions and reads| App[Next.js App Router]
    Admin[Admin browser] -->|Server actions and reads| App
    App -->|SSR auth session| Supabase[Supabase]
    App -->|RLS-protected queries and RPCs| Database[(Postgres)]
    App -->|Private upload and signed URL| Storage[(Supabase Storage)]
    Database -->|Auth trigger creates profile| Auth[(Supabase Auth)]
    Vercel[Vercel cron] -->|Daily GET /api/health| Health[Health route]
    Health -->|Service-role query| Database
    Map[Leaflet + OpenStreetMap] -.-> Citizen
```

The normal application path uses the browser's authenticated Supabase session
through the Next.js server client. Row Level Security limits citizens to their
own data, while administrator-only mutations are exposed through guarded server
actions and security-definer database functions. The service-role client is
used only by the health route and never reaches the browser.

### Request lifecycle

```mermaid
flowchart TD
    Submit[Citizen submits report] --> Validate[Validate fields and optional image]
    Validate -->|Valid| Create[Insert request as pending]
    Validate -->|Invalid| Error[Return form error]
    Create --> Initial[Trigger records initial status]
    Initial --> Review[Admin reviews request]
    Review --> Decision{Admin action}
    Decision -->|Update status or note| Update[Guarded post_request_update RPC]
    Decision -->|Link duplicate| Link[Guarded link_request RPC]
    Decision -->|Leave separate| Monitor[Continue tracking]
    Update --> History[Append status_history entry]
    Link --> Follow[Linked report follows original status]
    History --> Notify[Citizen sees current status and timeline]
    Follow --> Notify
    Monitor --> Notify
    Notify -->|Resolved or rejected| Final[Final state]
    Final -->|Admin reopens| Update
```

### Database schema

The checked-in diagram below is the Supabase schema snapshot. The Mermaid
diagram provides a readable version of the same application-owned tables and
their important relationships; `auth.users` is managed by Supabase Auth.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has"
    PROFILES ||--o{ REQUESTS : submits
    REQUESTS ||--o{ STATUS_HISTORY : records
    PROFILES ||--o{ STATUS_HISTORY : changes
    REQUESTS }o--o| REQUESTS : "duplicate_of"

    AUTH_USERS {
        uuid id PK
    }
    PROFILES {
        uuid id PK, FK
        text full_name
        user_role role
        timestamptz created_at
    }
    REQUESTS {
        uuid id PK
        uuid citizen_id FK
        request_category category
        text location
        text description
        text image_path
        request_status status
        text reference UK
        uuid duplicate_of FK
        timestamptz created_at
        timestamptz updated_at
    }
    STATUS_HISTORY {
        uuid id PK
        uuid request_id FK
        request_status status
        uuid changed_by FK
        text note
        timestamptz created_at
    }
```

![Supabase schema diagram](./public/supabase-schema-lweadehzhunuykqyzuqw.png)

`healthcheck` is intentionally independent of the request graph and is queried
by the daily uptime endpoint. Request images are stored separately in the
private `request-images` bucket, with the first storage path segment set to the
citizen UUID and access enforced by Storage RLS policies.

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


```Live URL:``` [Tatua Service Requests](https://tatua-service-requests.vercel.app/)

## Screenshots

### Landing and authentication

| Landing page | Sign up — light theme |
| --- | --- |
| ![Tatua landing page](./public/images/screenshots/landing.png) | ![Sign-up page in the light theme](./public/images/screenshots/sign_up_light.png) |

| Sign up — dark theme |
| --- |
| ![Sign-up page in the dark theme](./public/images/screenshots/sign_up_dark.png) |

### Citizen experience

| Citizen landing page | Citizen requests |
| --- | --- |
| ![Citizen landing page](./public/images/screenshots/citizen_landing.png) | ![Citizen requests list](./public/images/screenshots/citizen_requests.png) |

| Citizen request details |
| --- |
| ![Citizen request details](./public/images/screenshots/citizen_request_details.png) |

### Admin experience

| Admin landing page | Admin requests |
| --- | --- |
| ![Admin landing page](./public/images/screenshots/admin_landing.png) | ![Admin requests list](./public/images/screenshots/admin_requests.png) |

| Admin request details |
| --- |
| ![Admin request details](./public/images/screenshots/admin_request_details.png) |
