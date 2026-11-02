import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/password-reset";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      {/* The form reads ?token= from the address, which is only known in the browser. */}
      <Suspense fallback={<div className="card mx-auto h-[380px] w-full max-w-[440px] animate-pulse" aria-label="Loading" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
