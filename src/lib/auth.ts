import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db";
import * as schema from "../db/schema";
import { canSendEmail, resetPasswordEmail, sendEmail } from "./email";

const vercelUrl = (host?: string) => (host ? `https://${host}` : undefined);

// Netlify sets URL (the main site), DEPLOY_PRIME_URL (this branch or preview) and CONTEXT.
const netlifyUrl =
  process.env.CONTEXT && process.env.CONTEXT !== "production" ? process.env.DEPLOY_PRIME_URL : process.env.URL;

const baseURL =
  process.env.BETTER_AUTH_URL ??
  vercelUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  netlifyUrl ??
  "http://localhost:3000";

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL,
  trustedOrigins: [
    baseURL,
    vercelUrl(process.env.VERCEL_URL),
    vercelUrl(process.env.VERCEL_BRANCH_URL),
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
  ].filter((o): o is string => Boolean(o)),
  database: drizzleAdapter(db, { provider: "mysql", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    // "Forgot password?" works once email is set up (see src/lib/email.ts).
    sendResetPassword: canSendEmail
      ? async ({ user, url }) => sendEmail(resetPasswordEmail(user.email, user.name, url))
      : undefined,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    // A reset signs out every device, in case someone else had the old password.
    revokeSessionsOnPasswordReset: true,
  },
  // Limits on sign-in, sign-up and reset attempts per IP address (Better Auth's defaults: 3 sign-ins per
  // 10 seconds, 3 reset emails per minute). Stored in the database because serverless functions don't share
  // memory, so limits kept in memory would barely apply. Active in production only.
  rateLimit: { storage: "database" },
  advanced: {
    ipAddress: {
      // Which request header holds the visitor's real IP. Each host sets its own and overwrites
      // what the browser sends; without this, every visitor could end up sharing one limit.
      ipAddressHeaders: process.env.VERCEL ? ["x-real-ip", "x-forwarded-for"] : ["x-nf-client-connection-ip", "x-forwarded-for"],
    },
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
  // Lets people delete their account from Settings. Password accounts confirm with their password;
  // Google-only accounts need a sign-in from the last day. Tracker data is removed by the foreign-key cascade.
  user: { deleteUser: { enabled: true } },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // refresh once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [nextCookies()],
});

export const isGoogleEnabled = googleConfigured;
