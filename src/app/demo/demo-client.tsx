"use client";

import { useState } from "react";
import { Dashboard, DashboardSkeleton } from "@/components/tracker/dashboard";
import { useIsClient } from "@/lib/hooks";
import { sampleTracker } from "@/lib/tracker/sample";

/**
 * The full dashboard with sample data. Nothing is sent to the server.
 * The data depends on today's date, so it is built in the browser only.
 */
export function DemoClient() {
  const isClient = useIsClient();
  if (!isClient) return <DashboardSkeleton />;
  return <DemoDashboard />;
}

function DemoDashboard() {
  const [data] = useState(() => sampleTracker());
  return <Dashboard initial={data} mode="demo" />;
}
