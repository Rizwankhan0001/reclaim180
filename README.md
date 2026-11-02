# Reclaim 180

A private 6-month NoFap and habit tracker: a live streak clock, daily habit check-ins, a 182-day calendar, urge SOS breathing, reset logging with trigger analysis, and progress charts. Each account's data is private, and people can export it, erase it, or delete their account from Settings.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css` (light and dark) |
| Database | MySQL 8 (or TiDB / PlanetScale / Aiven / RDS) via `mysql2` with a connection pool |
| ORM and migrations | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (email and password; Google optional) |
| Validation | Zod on every server action |
| Hosting | Vercel or Netlify (`netlify.toml` included) |

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
    forgot-password/, reset-password/  Password reset by email
    privacy/, terms/         Privacy policy and terms (contact email comes from CONTACT_EMAIL)
    error.tsx, not-found.tsx Friendly error and 404 pages
    manifest.ts, robots.ts   Installable app manifest; keeps private pages out of search engines
  components/
    tracker/                 Dashboard UI (hero, today card, insights, dialogs)
    ui/                      Modal, toast, number field
  db/
    schema.ts                All tables (auth + tracker)
    index.ts                 Drizzle client (mysql2 pool)
    connection.ts            Parses DATABASE_URL, turns on SSL for cloud hosts
  lib/
    auth.ts, auth-client.ts  Better Auth server and client (password reset, rate limits)
    email.ts                 Sends email through Resend (prints to the terminal in development)
    site.ts                  Contact email, policy date and the list of data providers shown in the privacy policy
    dal.ts                   Data access layer (session + queries, server only)
    validation.ts            Zod schemas
    look.ts                  Remembers theme and accent in the browser so pages paint in the right colors
    tracker/                 Pure logic: dates, streak math, constants, types
drizzle/                     SQL migrations (commit these)
```

## Database

Tables: `user`, `session`, `account`, `verification`, `rate_limit` (auth), plus `profile`, `habit`, `day_log`, `relapse`.

- `day_log` has one row per user per day. Habit results live in a `habits` JSON column keyed by habit id.
- All times are `DATETIME(3)` stored in UTC by the app, so the MySQL server's time zone doesn't matter.
- Removed habits are archived (`archived_at`), not deleted, so history stays intact.
- Every tracker table cascades on user delete, so deleting an account (Settings, Data and account) removes everything.
- A habit added later in Settings only counts from the day it was added (based on its `created_at` compared with the profile's), so it doesn't lower older days' scores.

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

## How saving works

- Check-ins save in the background a moment after each change. If the save fails (offline, server down), the day is also kept in the browser (`localStorage`, per user) and sent on the next visit, so closing the tab while offline loses nothing.
- Signing out, erasing data, or deleting the account clears everything the app kept in that browser.

## On phones

- Installable: in the browser, "Add to Home Screen" (iPhone: Share menu; Android: Install). It opens full screen like an app. After the first check-in, the dashboard suggests it once.
- Long-press the installed app's icon for shortcuts: **Urge SOS** opens the breathing screen straight away (`/dashboard?sos=1`), **Check in** jumps to today.
- Dialogs open as bottom sheets, buttons are finger-sized (about 40px), and the on-screen keyboard resizes the page instead of covering it.

## Security

- `next.config.ts` sends basic security headers on every response (no framing, no MIME sniffing, a strict referrer policy, HSTS). Backups are imported through a server action, so its body limit is raised to 8 MB.
- Sign-in, sign-up and password reset attempts are rate limited per IP address in production (3 sign-ins per 10 seconds, 3 reset emails per minute). Counters live in the `rate_limit` table because serverless functions don't share memory. The visitor's IP comes from `x-nf-client-connection-ip` on Netlify and `x-real-ip` on Vercel.
- Resetting a password signs the account out on every device. Reset links work once, for 1 hour.

## Password reset emails

"Forgot password?" appears once email is set up. In local development it always works: the email is printed in the terminal running `npm run dev`.

1. Create a free account at resend.com.
2. Add your domain there (Domains, then Add domain) and add the DNS records it shows at your domain's DNS host (GoDaddy, or Netlify if you moved DNS there). Wait until it shows Verified.
3. Create an API key.
4. In Netlify's environment variables, set `RESEND_API_KEY` and `EMAIL_FROM`, e.g. `Reclaim 180 <hello@yourdomain.com>`, then redeploy.

The email wording is deliberately neutral ("Reset your Reclaim 180 password"), since subjects show up in inbox previews and on lock screens.

## Privacy policy and terms

`/privacy` and `/terms` describe what the app actually stores. Before launch:

- Set `CONTACT_EMAIL` (shown on both pages; until then they show a placeholder).
- Check the provider list in `src/lib/site.ts` matches the services you use, and update `policyUpdated` whenever you change either page.
- Have someone qualified review them, especially if you'll have users in the EU or UK. They're a solid starting point, not legal advice.

New accounts must confirm they're 18 or older and agree to both pages.

## Deploying on Vercel

1. Import the GitHub repo in Vercel.
2. Add `DATABASE_URL` and `BETTER_AUTH_SECRET` under Project Settings, then Environment Variables.
3. Run `npm run db:migrate` against the production database once, and again after each schema change.
4. Every push to `main` deploys.

On Netlify, `netlify.toml` already sets the build. Add the same environment variables under Site configuration, then Environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CONTACT_EMAIL`, and for password reset `RESEND_API_KEY` and `EMAIL_FROM`.

Optional: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to turn on Google sign-in. The redirect URI is `https://YOUR_DOMAIN/api/auth/callback/google`.

## MySQL hosting notes

- Any MySQL 8.0+ server works. The host must accept connections from the internet so Vercel can reach it.
- SSL is on for every host except `localhost`. Set `DATABASE_SSL="false"` only for a server on a private network.
- The schema uses foreign keys. On PlanetScale, turn on foreign key support in the database settings first.
- Free option that works well with Vercel: TiDB Cloud Serverless (MySQL compatible, port 4000).

## Moving data from the original single-page tracker

In the old tracker, open Settings and press Export backup. In this app, choose "Import a backup instead" during setup, or use Settings, then Import backup.
