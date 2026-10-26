import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "./icons";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="wrap flex items-center gap-3 py-2.5">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight">
          <BrandMark />
          Reclaim 180
        </Link>
        <div className="flex-1" />
        {children}
      </div>
    </header>
  );
}
