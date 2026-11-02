import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsView } from "@/components/settings/settings-view";
import { SiteHeader } from "@/components/site-header";
import { hasPasswordAccount, loadTracker, requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

async function SettingsLoader() {
  const user = await requireUser();
  const [data, hasPassword] = await Promise.all([loadTracker(user.id), hasPasswordAccount(user.id)]);
  if (!data) redirect("/onboarding");
  return <SettingsView initial={data} email={user.email} hasPassword={hasPassword} />;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <div className="wrap py-10">
            <div className="card h-[600px] animate-pulse" aria-label="Loading settings" />
          </div>
        </>
      }
    >
      <SettingsLoader />
    </Suspense>
  );
}
