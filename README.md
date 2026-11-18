# Reclaim 180

A private 6-month NoFap and habit tracker: a live streak clock, daily habit check-ins, a 182-day calendar, urge SOS breathing, reset logging with trigger analysis, and progress charts. Each account's data is private.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css` (light and dark) |
| Database | Netlify Database (managed Postgres) via `@netlify/database` |
| ORM and migrations | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (email and password; Google optional) |
| Validation | Zod on every server action |
| Hosting | Netlify |

## Project layout

```
src/
  app/
    page.tsx                 Landing page
    sign-in/, sign-up/       Auth pages
    onboarding/              First-time setup (or import a backup)
    dashboard/               The tracker
    actions.ts               Server actions: save day, log reset, settings, import, erase
    api/auth/[...all]/       Better Auth endpoints
    api/export/              Download a JSON backup
    manifest.ts              Installable app (PWA) manifest
  components/
    tracker/                 Dashboard UI (hero, today card, insights, dialogs)
    ui/                      Modal, toast
  lib/
    auth.ts, auth-client.ts  Better Auth server and client
    dal.ts                   Data access layer (session + queries, server only)
    validation.ts            Zod schemas
    tracker/                 Pure logic: dates, streak math, constants, types
db/
  schema.ts                  All tables (auth + tracker)
  index.ts                   Drizzle client (Netlify Database adapter)
netlify/database/migrations/ SQL migrations (commit these)
```

## Database

Tables: `user`, `session`, `account`, `verification` (auth), plus `profile`, `habit`, `day_log`, `relapse`.

- `day_log` has one row per user per day. Habit results live in a `habits` JSON column keyed by habit id.
- Removed habits are archived (`archived_at`), not deleted, so history stays intact.
- Every tracker table cascades on user delete.

### Changing the schema

1. Edit `db/schema.ts`.
2. `npm run db:generate -- --name describe_the_change` creates a new migration in `netlify/database/migrations/`.
3. Commit the schema change and the migration together. Netlify applies pending migrations automatically on deploy (deploy previews get their own database branch).

Never edit a migration that has already been deployed; add a new one instead.

## Local development

```bash
cp .env.example .env.local   # then fill in BETTER_AUTH_SECRET
npm install
netlify dev                  # provides a local Netlify Database
```

## Deploying on Netlify

1. Under Site configuration → Environment variables, add `BETTER_AUTH_SECRET`. No database connection string is needed: Netlify Database is provisioned automatically.
2. Migrations in `netlify/database/migrations/` are applied automatically before each deploy is published.
3. Every push to `main` deploys.

Optional: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to turn on Google sign-in. The redirect URI is `https://YOUR_DOMAIN/api/auth/callback/google`.

## Moving data from the original single-page tracker

In the old tracker, open Settings and press Export backup. In this app, choose "Import a backup instead" during setup, or use Settings, then Import backup.
