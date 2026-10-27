import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsView } from "@/components/settings/settings-view";
import { SiteHeader } from "@/components/site-header";
import { loadTracker, requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Settings" };

async function SettingsLoader() {
  const user = await requireUser();
  const data = await loadTracker(user.id);
  if (!data) redirect("/onboarding");
  return <SettingsView initial={data} email={user.email} />;
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
