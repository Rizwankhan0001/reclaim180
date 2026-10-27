import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Dashboard, DashboardSkeleton } from "@/components/tracker/dashboard";
import { loadTracker, requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Dashboard" };

async function DashboardLoader() {
  const user = await requireUser();
  const data = await loadTracker(user.id);
  if (!data) redirect("/onboarding");
  return <Dashboard initial={data} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLoader />
    </Suspense>
  );
}
