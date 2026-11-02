import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/password-reset";
import { canSendEmail } from "@/lib/email";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      {canSendEmail ? (
        <ForgotPasswordForm />
      ) : (
        // Email isn't set up on this deployment yet (no RESEND_API_KEY).
        <div className="card mx-auto grid w-full max-w-[440px] gap-4 !p-8 shadow-lift">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em]">Forgot your password?</h1>
          <p className="text-[15px] text-muted">
            Password reset by email isn&apos;t available yet.
            {site.contactEmail ? (
              <>
                {" "}
                Email <a className="font-semibold text-accent" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> from the
                address you signed up with and we&apos;ll help.
              </>
            ) : null}
          </p>
          <Link href="/sign-in" className="btn w-full">
            Back to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
