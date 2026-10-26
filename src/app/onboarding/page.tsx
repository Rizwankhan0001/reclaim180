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
      <main className="wrap grid flex-1 gap-10 py-10 md:grid-cols-[1fr_1.1fr] md:py-16">
        <div>
          <div className="eyebrow">Step 1 of 1</div>
          <h1 className="mt-3 text-[clamp(34px,5vw,56px)] leading-[0.98] font-extrabold tracking-[-0.035em]">
            Set up your <span className="text-accent">180 days.</span>
          </h1>
          <p className="mt-4 max-w-[44ch] text-[16px] text-muted">
            Pick a goal and the daily habits that will carry you through it. You can change any of this later in
            Settings.
          </p>
          <ul className="mt-6 grid max-w-[44ch] gap-3 text-sm text-muted">
            <li>
              <b className="text-ink">Backdate your start</b> if you&apos;re already clean, so your streak is right
              from day one.
            </li>
            <li>
              <b className="text-ink">Keep habits few.</b> Five you do daily beat twelve you skip.
            </li>
            <li>
              <b className="text-ink">Write real reasons.</b> They show up on screen when an urge hits.
            </li>
          </ul>
        </div>
        <Suspense fallback={<div className="card h-[620px] animate-pulse" aria-label="Loading" />}>
          <Gate />
        </Suspense>
      </main>
    </>
  );
}
