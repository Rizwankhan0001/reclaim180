"use client";

import "./globals.css";

/** Last-resort error screen, used only when the root layout itself fails. It replaces the whole document. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center p-6">
        <title>Something went wrong · Reclaim 180</title>
        <div className="card grid w-full max-w-[440px] gap-4 !p-8 text-center">
          <h1 className="text-[24px] font-extrabold">Something went wrong</h1>
          <p className="text-[15px] text-muted">Reclaim 180 couldn&apos;t load. Your data is safe. Try again in a moment.</p>
          <div>
            <button type="button" className="btn btn-primary" onClick={() => retry()}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
