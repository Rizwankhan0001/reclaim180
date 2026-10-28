import type { Metadata } from "next";
import { DemoClient } from "./demo-client";

export const metadata: Metadata = {
  title: "Try the demo",
  description: "Explore Reclaim 180 with sample data. No account needed, nothing is saved.",
};

export default function DemoPage() {
  return <DemoClient />;
}
