import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { ArrowRightIcon, BrandMark, CircleCheckIcon, DownloadIcon, EyeOffIcon, LockIcon, PlusIcon, ShieldIcon } from "@/components/icons";
import { PhaseTrack } from "@/components/phase-track";
import {
  MiniCustomize,
  MiniHabits,
  MiniHeatmap,
  MiniMilestones,
  MiniScale,
  MiniSos,
  MiniTriggers,
  ProductPreview,
} from "@/components/landing/previews";
import { PHASES, SCALE_WORDS } from "@/lib/tracker/constants";
import { getSession } from "@/lib/dal";

/* ------------------------------------------------------------------ header */

async function HeaderActions() {
  const session = await getSession();
  if (session) {
    return (
      <Link href="/dashboard" className="btn btn-primary btn-glow !py-2">
        Open my tracker
      </Link>
    );
  }
  return <SignedOutActions />;
}

function SignedOutActions() {
  return (
    <>
      <Link href="/sign-in" className="btn btn-quiet !py-2 !text-night-muted hover:!text-night-ink">
        Sign in
      </Link>
      <Link href="/sign-up" className="btn btn-primary btn-glow hidden !py-2 sm:inline-flex">
        Get started
      </Link>
    </>
  );
}

/* ------------------------------------------------------------------ content */

const STEPS = [
  {
    title: "Set your goal",
    body: "Pick 90 days, 6 months or a year, choose the daily habits you want to build, and write down why you're doing this.",
    time: "1 minute",
  },
  {
    title: "Check in once a day",
    body: "Tick your habits and rate your mood, energy and urges in plain words. Everything saves on its own.",
    time: "30 seconds",
  },
  {
    title: "Watch it add up",
    body: "Your streak, milestones, calendar and charts update as you go, so you can see what's working.",
    time: "Every day",
  },
];

const FAQ = [
  {
    q: "Is it really private?",
    a: "Yes. Your check-ins are tied to your account and nobody else can see them. There are no ads and no tracking scripts, and you can export or erase everything from Settings at any time.",
  },
  {
    q: "What happens if I relapse?",
    a: "You log a reset. Your current streak starts again, but your clean days, best streak and full history stay. Each reset also asks what set it off, so you learn what to watch for.",
  },
  {
    q: "Do I have to check in every day?",
    a: "Daily check-ins give you the clearest picture, but the streak clock runs on its own. If you miss a day, you can fill it in later.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. It works in any phone browser, and you can add it to your home screen so it opens like an app.",
  },
  {
    q: "Why 180 days?",
    a: "Six months is long enough for new habits to settle and for the hardest phases to pass. If you'd like a different target, choose 90 days or a year instead.",
  },
  {
    q: "Does it cost anything?",
    a: "No. Create an account and start tracking for free.",
  },
];

const PRIVACY = [
  { Icon: EyeOffIcon, title: "Only you see it", body: "Entries are tied to your account. Nobody else can read them." },
  { Icon: ShieldIcon, title: "No ads, no tracking", body: "No ad networks and no analytics scripts watching what you do." },
  { Icon: DownloadIcon, title: "Your data, your call", body: "Export a backup or erase everything from Settings in one click." },
];

function FeatureRow({
  eyebrow,
  title,
  body,
  points,
  visual,
  flip,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <div className={flip ? "md:order-2" : ""}>
        <div className="eyebrow !text-accent">{eyebrow}</div>
        <h3 className="mt-2 text-[clamp(26px,3vw,34px)] leading-[1.1] font-extrabold tracking-[-0.02em]">{title}</h3>
        <p className="mt-3 max-w-[48ch] text-[16px] text-muted">{body}</p>
        <ul className="mt-5 grid gap-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[15px]">
              <CircleCheckIcon className="mt-0.5 h-5 w-5 flex-none text-heat-3" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className={`card !p-6 shadow-lift ${flip ? "md:order-1" : ""}`}>{visual}</div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <div className="night">
        <SiteHeader variant="night">
          <nav className="mr-3 hidden gap-1 md:flex">
            {[
              ["#how", "How it works"],
              ["#features", "Features"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-night-muted hover:text-night-ink">
                {label}
              </a>
            ))}
          </nav>
          <Suspense fallback={<SignedOutActions />}>
            <HeaderActions />
          </Suspense>
        </SiteHeader>

        <section className="wrap grid items-center gap-14 pt-8 pb-24 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-32">
          <div className="animate-[float-in_0.6s_ease_both]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[13px] font-medium text-night-muted">
              <i className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
              Free · Private · Works on your phone
            </span>
            <h1 className="mt-5 text-[clamp(44px,6.4vw,80px)] leading-[0.95] font-extrabold tracking-[-0.04em] text-night-ink">
              Take back <span className="text-accent">180 days.</span>
              <br />
              Day by day.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-night-muted">
              Reclaim 180 is a private NoFap tracker that keeps your streak, your daily habits and your progress in one
              calm place, with help on hand when an urge hits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn btn-primary btn-glow !px-6 !py-3.5 text-base">
                Start my 180 days <ArrowRightIcon />
              </Link>
              <a href="#how" className="btn !px-6 !py-3.5 text-base">
                See how it works
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-night-muted">
              {["No ads, no tracking", "Only you see your data", "30 seconds a day"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CircleCheckIcon className="h-4 w-4 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <ProductPreview />
        </section>
      </div>

      <main className="flex-1">
        {/* -------------------------------------------------------- how it works */}
        <section id="how" className="wrap scroll-mt-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow !text-accent">How it works</div>
            <h2 className="mt-2 text-[clamp(30px,4vw,44px)] leading-tight font-extrabold tracking-[-0.025em]">
              Three steps. No learning curve.
            </h2>
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card relative grid content-start gap-3 !p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent font-display text-xl font-extrabold text-accent-ink">
                  {i + 1}
                </span>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-[15px] text-muted">{s.body}</p>
                <span className="num mt-1 text-[12px] text-faint">{s.time}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------------ features */}
        <section id="features" className="scroll-mt-6 border-y border-line bg-surface-2/60 py-20 md:py-28">
          <div className="wrap grid gap-24">
            <div className="mx-auto max-w-2xl text-center">
              <div className="eyebrow !text-accent">Features</div>
              <h2 className="mt-2 text-[clamp(30px,4vw,44px)] leading-tight font-extrabold tracking-[-0.025em]">
                Everything you need. Nothing you don&apos;t.
              </h2>
            </div>
            <FeatureRow
              eyebrow="Streak and milestones"
              title="Watch every day add up"
              body="A live clock counts the days, hours and minutes since your last reset. Milestones unlock along the way, from your first day to day 182."
              points={["Live streak clock and progress ring", "Milestone badges at 1, 7, 30, 90 and 182 days", "Your best streak is always kept"]}
              visual={
                <div className="grid gap-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[15px] font-bold">Milestones</span>
                    <span className="num text-[13px] text-muted">47 days</span>
                  </div>
                  <MiniMilestones reached={5} />
                  <div className="track">
                    <i style={{ width: "57%" }} />
                  </div>
                  <span className="text-[13px] text-muted">
                    Next milestone: <b className="text-ink">60 days</b> · 12 days to go
                  </span>
                </div>
              }
            />
            <FeatureRow
              flip
              eyebrow="Daily check-in"
              title="A 30-second check-in"
              body="Tick the habits that hold your streak up, and say how the day felt in plain words. No numbers to decode."
              points={["Yes/no and counted habits (like glasses of water)", "Mood, energy and urges in everyday words", "A short journal line for what helped"]}
              visual={
                <div className="grid gap-4">
                  <MiniHabits />
                  <MiniScale label="Mood" words={SCALE_WORDS.mood} active={3} />
                  <MiniScale label="Urges" words={SCALE_WORDS.urge} active={1} warm />
                </div>
              }
            />
            <FeatureRow
              eyebrow="Six-month map"
              title="Six months on one page"
              body="Each square is a day, shaded by how many habits you did. Resets are marked, so good stretches and hard weeks stand out at a glance."
              points={["Click any day to see or edit it", "Charts for mood vs. urges and habit strength", "A journal of every note and reset"]}
              visual={
                <div className="grid gap-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[15px] font-bold">182 day map</span>
                    <span className="text-[13px] text-muted">Example</span>
                  </div>
                  <MiniHeatmap />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                    <span className="inline-flex items-center gap-[3px]">
                      Fewer habits
                      {[0, 1, 2, 3, 4].map((l) => (
                        <i key={l} className="inline-block h-[10px] w-[10px] rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
                      ))}
                      More
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <i className="inline-block h-2.5 w-2.5 rounded-full bg-bad" /> Reset
                    </span>
                  </div>
                </div>
              }
            />
            <FeatureRow
              flip
              eyebrow="Urge SOS"
              title="Help in the hardest moment"
              body="When an urge hits, one tap opens a calm screen: a breathing guide, your own reasons in front of you, and quick actions to break the loop."
              points={["Guided box breathing with a timer", "Your reasons, written by you, shown on screen", "Count every urge you get through"]}
              visual={<MiniSos />}
            />
            <FeatureRow
              flip
              eyebrow="Make it yours"
              title="Shape it around your life"
              body="Pick your colors, your habits and the days they apply to. Turn off what you don't need, and set a reward for every milestone."
              points={[
                "Light or dark theme and five accent colors",
                "Habits with icons, daily goals and weekday schedules",
                "Your own mantra, triggers, SOS actions and rewards",
              ]}
              visual={<MiniCustomize />}
            />
            <FeatureRow
              eyebrow="Patterns"
              title="Learn what trips you up"
              body="When you log a reset, note what set it off. Reclaim 180 shows your most common triggers and a practical tip for each."
              points={["Trigger chart built from your own resets", "Spots late-night patterns automatically", "A concrete tip for your top trigger"]}
              visual={<MiniTriggers />}
            />
          </div>
        </section>

        {/* -------------------------------------------------------- road to 180 */}
        <section className="wrap py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow !text-accent">The road to 180</div>
            <h2 className="mt-2 text-[clamp(30px,4vw,44px)] leading-tight font-extrabold tracking-[-0.025em]">
              Know what&apos;s coming, so it doesn&apos;t throw you
            </h2>
            <p className="mt-3 text-[16px] text-muted">
              Most people go through four phases. Your dashboard shows which one you&apos;re in and what helps right now.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <PhaseTrack days={null} />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.slice(0, 4).map((p) => (
              <div key={p.name} className="card grid content-start gap-2 !p-5">
                <span className="num text-[12px] text-accent">{p.range}</span>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="text-[14px] text-muted">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------ privacy */}
        <section className="wrap pb-20 md:pb-28">
          <div className="card grid gap-8 !p-8 md:grid-cols-[1fr_1.4fr] md:items-center md:!p-12">
            <div>
              <LockIcon className="h-9 w-9 text-accent" />
              <h2 className="mt-4 text-[clamp(26px,3vw,36px)] leading-tight font-extrabold tracking-[-0.02em]">
                Private by design
              </h2>
              <p className="mt-2 text-[16px] text-muted">This is personal. It stays that way.</p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-3">
              {PRIVACY.map(({ Icon, title, body }) => (
                <li key={title} className="grid content-start gap-1.5">
                  <Icon className="h-6 w-6 text-heat-3" />
                  <b className="text-[15px]">{title}</b>
                  <span className="text-[14px] text-muted">{body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------------------------------------------- FAQ */}
        <section id="faq" className="wrap scroll-mt-6 pb-20 md:pb-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-[clamp(30px,4vw,44px)] leading-tight font-extrabold tracking-[-0.025em]">Questions</h2>
            <div className="mt-10 grid gap-3">
              {FAQ.map((f) => (
                <details key={f.q} className="faq card !p-0">
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 text-[16px] font-bold">
                    {f.q}
                    <PlusIcon className="faq-plus h-5 w-5 flex-none text-muted" />
                  </summary>
                  <p className="px-6 pb-5 text-[15px] text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- final CTA */}
        <section className="wrap pb-20">
          <div className="night rounded-[28px] px-6 py-16 text-center md:py-20">
            <h2 className="mx-auto max-w-2xl text-[clamp(32px,4.5vw,52px)] leading-[1.02] font-extrabold tracking-[-0.03em] text-night-ink">
              Day one can be <span className="text-accent">today.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[17px] text-night-muted">It takes a minute to set up. Your future self will thank you.</p>
            <Link href="/sign-up" className="btn btn-primary btn-glow mt-8 !px-7 !py-3.5 text-base">
              Start my 180 days <ArrowRightIcon />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 text-[13px] text-muted">
          <span className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <BrandMark className="h-5 w-5" /> Reclaim 180
          </span>
          <span>Your data stays yours. Export or erase it any time.</span>
        </div>
      </footer>
    </>
  );
}
