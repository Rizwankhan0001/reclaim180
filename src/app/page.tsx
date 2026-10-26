import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { ClockIcon, DropIcon, GridIcon, ShieldIcon, CheckIcon } from "@/components/icons";
import { getSession } from "@/lib/dal";

const FEATURES = [
  { icon: ClockIcon, title: "Live streak clock", body: "Days, hours and minutes, with milestones from day 1 to day 180." },
  { icon: CheckIcon, title: "Daily habit check-in", body: "Workout, sleep, cold showers, reading. Pick yours or add your own." },
  { icon: GridIcon, title: "Six-month calendar", body: "Every day on one map, so patterns jump out." },
  { icon: DropIcon, title: "Urge SOS", body: "A guided breathing timer and your own reasons, one tap away." },
  { icon: ShieldIcon, title: "Private by default", body: "Your entries are tied to your account. No one else can see them." },
];

async function HeaderActions() {
  const session = await getSession();
  if (session) {
    return (
      <Link href="/dashboard" className="btn btn-primary !py-2">
        Open my tracker
      </Link>
    );
  }
  return <SignedOutActions />;
}

function SignedOutActions() {
  return (
    <>
      <Link href="/sign-in" className="btn btn-quiet !py-2">
        Sign in
      </Link>
      <Link href="/sign-up" className="btn btn-primary !py-2">
        Get started
      </Link>
    </>
  );
}

function HeroRing() {
  const r = 108;
  const c = 2 * Math.PI * r;
  const frac = 47 / 182;
  return (
    <div className="card relative mx-auto grid w-full max-w-[400px] justify-items-center gap-4 !p-8">
      <span className="eyebrow self-start">Example</span>
      <div className="relative h-[240px] w-[240px]">
        <svg viewBox="0 0 260 260" className="h-full w-full" aria-hidden="true">
          <circle cx="130" cy="130" r={r} fill="none" stroke="var(--heat-0)" strokeWidth="14" />
          <circle
            cx="130"
            cy="130"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${c * frac} ${c}`}
            transform="rotate(-90 130 130)"
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <div className="font-display text-[72px] leading-[0.9] font-extrabold tracking-[-0.04em]">47</div>
          <div className="mt-1.5 text-[13px] font-medium text-muted">days clean</div>
          <div className="num text-xs text-faint">of 182</div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <span className="chip !border-transparent !bg-accent-soft">Rewiring phase</span>
        <span className="chip">
          Best: <span className="num">47d</span>
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader>
        <Suspense fallback={<SignedOutActions />}>
          <HeaderActions />
        </Suspense>
      </SiteHeader>
      <main className="flex-1">
        <section className="wrap grid items-center gap-10 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <div className="eyebrow">A 6-month reset, one day at a time</div>
            <h1 className="mt-3 text-[clamp(40px,6vw,72px)] leading-[0.96] font-extrabold tracking-[-0.035em]">
              Take back <span className="text-accent">180 days.</span>
              <br />
              Track every one.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] text-muted">
              A private tracker for your NoFap streak and the daily habits that hold it up. Built for the long run,
              honest about the hard days.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn btn-primary !px-5 !py-3 text-base">
                Start my 180 days
              </Link>
              <Link href="/sign-in" className="btn !px-5 !py-3 text-base">
                I already have an account
              </Link>
            </div>
          </div>
          <HeroRing />
        </section>

        <section className="wrap pb-20">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="card grid content-start gap-2 !p-5">
                <Icon className="h-6 w-6 text-accent" />
                <h2 className="text-[17px] font-bold">{title}</h2>
                <p className="text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t border-line py-6 text-center text-[13px] text-muted">
        Reclaim 180 · Your data stays yours. Export or erase it any time.
      </footer>
    </>
  );
}
