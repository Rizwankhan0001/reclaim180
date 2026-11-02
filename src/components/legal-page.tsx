import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { site } from "@/lib/site";

/** Shared layout for the privacy policy and terms: readable line length, clear headings. */
export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <>
      <SiteHeader>
        <Link href="/sign-in" className="btn btn-quiet !py-2">
          Sign in
        </Link>
      </SiteHeader>
      <main className="wrap flex-1 py-10 md:py-14">
        <article className="legal mx-auto max-w-[68ch]">
          <p className="eyebrow">Last updated {site.policyUpdated}</p>
          <h1 className="mt-1 text-[clamp(30px,5vw,42px)] leading-tight font-extrabold tracking-[-0.02em]">{title}</h1>
          <div className="mt-4 text-[16px] text-muted">{intro}</div>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

/** The contact address, or a clear placeholder until CONTACT_EMAIL is set. */
export function ContactEmail() {
  if (!site.contactEmail) return <b>[contact email not set yet]</b>;
  return (
    <a href={`mailto:${site.contactEmail}`} className="font-semibold text-accent">
      {site.contactEmail}
    </a>
  );
}
