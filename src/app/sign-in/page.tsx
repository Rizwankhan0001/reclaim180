import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <>
      <SiteHeader />
      <main className="wrap flex flex-1 items-start justify-center py-12 md:py-20">
        <Suspense>
          <RedirectIfSignedIn />
        </Suspense>
        <AuthForm mode="sign-in" googleEnabled={googleEnabled} />
      </main>
    </>
  );
}
