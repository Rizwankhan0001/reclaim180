import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { OnboardingForm } from "@/components/onboarding-form";
import { hasProfile, requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Set up" };

async function Gate() {
  const user = await requireUser();
  if (await hasProfile(user.id)) redirect("/dashboard");
  return <OnboardingForm defaultName={user.name} />;
}

export default function OnboardingPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap flex-1 py-10 md:py-16">
        <Suspense fallback={<div className="card mx-auto h-[520px] w-full max-w-[680px] animate-pulse" aria-label="Loading" />}>
          <Gate />
        </Suspense>
      </main>
    </>
  );
}
