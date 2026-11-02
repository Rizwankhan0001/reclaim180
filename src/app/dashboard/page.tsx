import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Dashboard, DashboardSkeleton } from "@/components/tracker/dashboard";
import { loadTracker, requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

async function DashboardLoader() {
  const user = await requireUser();
  const data = await loadTracker(user.id);
  if (!data) redirect("/onboarding");
  return (
    <Dashboard initial={data} storageKey={`reclaim180:unsaved:${user.id}`} account={{ name: user.name, email: user.email }} />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLoader />
    </Suspense>
  );
}
