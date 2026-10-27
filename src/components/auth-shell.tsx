import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark, CircleCheckIcon } from "./icons";
import { SiteHeader } from "./site-header";
import { MiniRing } from "./landing/previews";

/** Split layout for sign-in and sign-up: brand panel on the left, form on the right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <aside className="night hidden flex-col justify-between p-10 lg:flex xl:p-14">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight text-night-ink">
          <BrandMark onDark />
          Reclaim 180
        </Link>
        <div className="grid gap-8">
          <div className="w-fit rounded-[24px] bg-surface p-5 text-ink shadow-lift">
            <MiniRing days={30} goal={182} size={150} />
          </div>
          <div>
            <h2 className="max-w-[16ch] text-[40px] leading-[1.02] font-extrabold tracking-[-0.03em] text-night-ink">
              Every streak starts with <span className="text-accent">day one.</span>
            </h2>
            <ul className="mt-6 grid gap-3 text-[15px] text-night-muted">
              {["A live streak clock and milestones", "A 30-second daily check-in", "Help on hand when an urge hits"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <CircleCheckIcon className="h-5 w-5 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-[13px] text-night-muted">Private by design. No ads, no tracking.</p>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="lg:hidden">
          <SiteHeader />
        </div>
        <main className="wrap flex flex-1 items-center justify-center py-10">{children}</main>
      </div>
    </div>
  );
}
