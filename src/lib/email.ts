import "server-only";

/*
 * Sending email (password resets). Uses Resend's HTTP API, so no extra package is needed.
 * - Production: turns on once RESEND_API_KEY is set. Until then, "Forgot password?" is hidden.
 * - Local development without a key: emails are printed to the server console instead of sent.
 */

const isDev = process.env.NODE_ENV !== "production";

/** True when the app can deliver email (or print it, in development). */
export const canSendEmail = Boolean(process.env.RESEND_API_KEY) || isDev;

type Email = { to: string; subject: string; text: string; html: string };

export async function sendEmail({ to, subject, text, html }: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!isDev) throw new Error("Email isn't set up. Add RESEND_API_KEY to the environment variables.");
    console.log(`\n[email] to ${to}\n[email] subject: ${subject}\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // Resend's test sender only delivers to your own address; set EMAIL_FROM once your domain is verified.
      from: process.env.EMAIL_FROM || "Reclaim 180 <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Email wasn't sent (Resend ${res.status}): ${(await res.text()).slice(0, 300)}`);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * The password reset email. The wording stays neutral on purpose: subjects and first lines show up
 * in inbox previews and on lock screens, so nothing hints at what the app tracks.
 */
export function resetPasswordEmail(to: string, name: string, url: string): Email {
  const hi = name.trim() ? `Hi ${name.trim()},` : "Hi,";
  const text = [
    hi,
    "",
    "Someone asked to reset the password for your Reclaim 180 account. Use this link to choose a new one. It works for 1 hour:",
    url,
    "",
    "If you didn't ask for this, you can ignore this email. Your password won't change.",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#edf1f4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#122030">
<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
<p style="margin:0 0 16px;font-size:15px">${escapeHtml(hi)}</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5">Someone asked to reset the password for your Reclaim 180 account. Use the button below to choose a new one. It works for 1 hour.</p>
<p style="margin:0 0 24px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#cf5f22;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Choose a new password</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#5b6979">If you didn't ask for this, you can ignore this email. Your password won't change.</p>
</div></body></html>`;
  return { to, subject: "Reset your Reclaim 180 password", text, html };
}
