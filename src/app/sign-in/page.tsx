import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";
import { AuthShell } from "@/components/auth-shell";
import { ResetNotice } from "@/components/password-reset";
import { canSendEmail } from "@/lib/email";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <AuthShell>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthForm
        mode="sign-in"
        googleEnabled={googleEnabled}
        resetEnabled={canSendEmail}
        notice={
          <Suspense>
            <ResetNotice />
          </Suspense>
        }
      />
    </AuthShell>
  );
}
