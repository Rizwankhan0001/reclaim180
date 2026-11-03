import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db";
import * as schema from "../db/schema";

const vercelUrl = (host?: string) => (host ? `https://${host}` : undefined);

// On Netlify, URL is the site's main address and DEPLOY_PRIME_URL / DEPLOY_URL
// are the addresses of the current deploy (previews and branch deploys).
const netlifyUrl = process.env.CONTEXT === "production" ? process.env.URL : process.env.DEPLOY_PRIME_URL;

const baseURL =
  process.env.BETTER_AUTH_URL ??
  netlifyUrl ??
  vercelUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  "http://localhost:3000";

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL,
  trustedOrigins: [
    baseURL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    vercelUrl(process.env.VERCEL_URL),
    vercelUrl(process.env.VERCEL_BRANCH_URL),
  ].filter((o): o is string => Boolean(o)),
  database: drizzleAdapter(db, { provider: "mysql", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  // Google sign-in turns on automatically once both env vars are set.
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // refresh once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [nextCookies()],
});

export const isGoogleEnabled = googleConfigured;
