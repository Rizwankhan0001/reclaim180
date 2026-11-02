"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";

/** Shown when a page fails to load, for example when the database can't be reached. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";

  return (
    <>
      <SiteHeader />
      <main className="wrap flex flex-1 items-center justify-center py-16">
        <div className="card grid w-full max-w-[460px] gap-4 !p-8 text-center shadow-lift">
          <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em]">Something went wrong</h1>
          <p className="text-[15px] text-muted">
            This page didn&apos;t load. Your data is safe. It&apos;s usually a short connection problem, so try again in a moment.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => retry()}>
              Try again
            </button>
            <Link href="/" className="btn">
              Go to the home page
            </Link>
          </div>
          {digest && <p className="num text-[11.5px] text-faint">Error reference: {digest}</p>}
        </div>
      </main>
    </>
  );
}
