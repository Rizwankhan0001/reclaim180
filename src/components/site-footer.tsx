import Link from "next/link";
import { BrandMark } from "./icons";

/** Bottom of the public pages: brand, privacy promise and the legal links. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13px] text-muted">
        <span className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
          <BrandMark className="h-5 w-5" /> Reclaim 180
        </span>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Legal">
          <Link href="/privacy" className="py-2 hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="/terms" className="py-2 hover:text-ink">
            Terms
          </Link>
          <span className="py-2">For adults 18+</span>
        </nav>
      </div>
    </footer>
  );
}
