# Reclaim 180

A private 6-month NoFap and habit tracker: a live streak clock, daily habit check-ins, a 182-day calendar, urge SOS breathing, reset logging with trigger analysis, and progress charts. Each account's data is private.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css` (light and dark) |
| Database | MySQL 8 (or TiDB / PlanetScale / Aiven / RDS) via `mysql2` with a connection pool |
| ORM and migrations | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (email and password; Google optional) |
| Validation | Zod on every server action |
| Hosting | Vercel |

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
  db/
    schema.ts                All tables (auth + tracker)
    index.ts                 Drizzle client (mysql2 pool)
    connection.ts            Parses DATABASE_URL, turns on SSL for cloud hosts
  lib/
    auth.ts, auth-client.ts  Better Auth server and client
    dal.ts                   Data access layer (session + queries, server only)
    validation.ts            Zod schemas
    tracker/                 Pure logic: dates, streak math, constants, types
drizzle/                     SQL migrations (commit these)
```

## Database

Tables: `user`, `session`, `account`, `verification` (auth), plus `profile`, `habit`, `day_log`, `relapse`.

- `day_log` has one row per user per day. Habit results live in a `habits` JSON column keyed by habit id.
- All times are `DATETIME(3)` stored in UTC by the app, so the MySQL server's time zone doesn't matter.
- Removed habits are archived (`archived_at`), not deleted, so history stays intact.
- Every tracker table cascades on user delete.

### Changing the schema

1. Edit `src/db/schema.ts`.
2. `npm run db:generate` creates a new SQL file in `drizzle/`.
3. `npm run db:migrate` applies it to the database in `DATABASE_URL`.
4. Commit the schema change and the migration together.

`npm run db:studio` opens a browser UI to view and edit data.

## Local development

```bash
cp .env.example .env.local   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm install
npm run db:migrate
npm run dev
```

Use a separate database for development (for example `reclaim180_dev`) so you never test against production data.

## Deploying on Vercel

1. Import the GitHub repo in Vercel.
2. Add `DATABASE_URL` and `BETTER_AUTH_SECRET` under Project Settings, then Environment Variables.
3. Run `npm run db:migrate` against the production database once, and again after each schema change.
4. Every push to `main` deploys.

Optional: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to turn on Google sign-in. The redirect URI is `https://YOUR_DOMAIN/api/auth/callback/google`.

## MySQL hosting notes

- Any MySQL 8.0+ server works. The host must accept connections from the internet so Vercel can reach it.
- SSL is on for every host except `localhost`. Set `DATABASE_SSL="false"` only for a server on a private network.
- The schema uses foreign keys. On PlanetScale, turn on foreign key support in the database settings first.
- Free option that works well with Vercel: TiDB Cloud Serverless (MySQL compatible, port 4000).

## Moving data from the original single-page tracker

In the old tracker, open Settings and press Export backup. In this app, choose "Import a backup instead" during setup, or use Settings, then Import backup.
