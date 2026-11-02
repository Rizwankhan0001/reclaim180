/*
 * Details shown in the privacy policy, terms and emails. Server-side only (reads environment variables).
 * Set CONTACT_EMAIL in your host's environment variables before launch.
 */

export const site = {
  name: "Reclaim 180",
  /** Where people can reach you about their data and account. */
  contactEmail: process.env.CONTACT_EMAIL || "",
  /** Change this date whenever you update the privacy policy or terms. */
  policyUpdated: "November 2, 2026",
  /** Services that handle people's data on your behalf. Edit if you use different providers. */
  providers: [
    { name: "Netlify", role: "hosts the website and runs the app's server code" },
    { name: "TiDB Cloud (PingCAP)", role: "stores the database (accounts and tracker data)" },
    { name: "Resend", role: "sends password reset emails" },
    { name: "Google", role: "handles Google sign-in, only if you choose to use it" },
  ],
} as const;
