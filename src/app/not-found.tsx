import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap flex flex-1 items-center justify-center py-16">
        <div className="card grid w-full max-w-[460px] gap-4 !p-8 text-center shadow-lift">
          <p className="num text-[13px] font-semibold text-accent">404</p>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em]">This page doesn&apos;t exist</h1>
          <p className="text-[15px] text-muted">The link may be old or mistyped.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/dashboard" className="btn btn-primary">
              Open my tracker
            </Link>
            <Link href="/" className="btn">
              Home page
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
