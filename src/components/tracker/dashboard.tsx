"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveDay } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { ChartIcon, CircleCheckIcon, DropIcon, HomeIcon, ResetIcon, SettingsIcon, XIcon } from "@/components/icons";
import { ThemeApplier } from "@/components/theme-applier";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useIsClient, useNow } from "@/lib/hooks";
import { keyOf, startOfDay } from "@/lib/tracker/dates";
import { emptyLog, isLogged, relapseDayMap, streakInfo } from "@/lib/tracker/math";
import type { DayLog, Habit, Profile, Relapse, TrackerData } from "@/lib/tracker/types";
import { Hero, Milestones } from "./hero";
import { TodayCard } from "./today-card";
import { HabitRatesCard, HeatmapCard, JournalCard, StatsCard, TrendCard, TriggersCard } from "./insights";
import { ResetDialog, SosDialog } from "./dialogs";

type Sync = "saved" | "saving" | "error";
type DialogName = "sos" | "reset" | null;

export function Dashboard(props: { initial: TrackerData }) {
  return (
    <ToastProvider>
      <DashboardInner {...props} />
    </ToastProvider>
  );
}

function DashboardInner({ initial }: { initial: TrackerData }) {
  const toast = useToast();
  const isClient = useIsClient();
  const now = useNow(30_000);

  const [profile] = useState<Profile>(initial.profile);
  const [habits] = useState<Habit[]>(initial.habits);
  const [logs, setLogs] = useState<Record<string, DayLog>>(initial.logs);
  const [relapses, setRelapses] = useState<Relapse[]>(initial.relapses);
  const [selected, setSelected] = useState<string | null>(null); // null = today
  const [sync, setSync] = useState<Sync>("saved");
  const [dialog, setDialog] = useState<DialogName>(null);

  /* ---- background saving: debounced per day, serialized per day ---- */
  const logsRef = useRef(logs);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const chains = useRef(new Map<string, Promise<void>>());
  const inflight = useRef(0);

  const settle = useCallback(() => {
    if (inflight.current === 0 && timers.current.size === 0) setSync((s) => (s === "error" ? s : "saved"));
  }, []);

  const queueSave = useCallback(
    (date: string) => {
      setSync("saving");
      clearTimeout(timers.current.get(date));
      timers.current.set(
        date,
        setTimeout(() => {
          timers.current.delete(date);
          inflight.current++;
          const prev = chains.current.get(date) ?? Promise.resolve();
          const next = prev.then(async () => {
            const res = await saveDay(logsRef.current[date]).catch(() => ({ ok: false as const, error: "You're offline. Changes will save when you're back." }));
            inflight.current--;
            if (!res.ok) {
              setSync("error");
              toast(res.error);
              return;
            }
            setSync("saving");
            settle();
          });
          chains.current.set(date, next);
        }, 600),
      );
    },
    [settle, toast],
  );

  const updateDay = useCallback(
    (date: string, fn: (log: DayLog) => DayLog) => {
      const prev = logsRef.current[date] ?? emptyLog(date);
      logsRef.current = { ...logsRef.current, [date]: fn(prev) };
      setLogs(logsRef.current);
      queueSave(date);
    },
    [queueSave],
  );

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (sync !== "saving") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [sync]);

  if (!isClient) return <DashboardSkeleton />;

  const today = startOfDay(new Date(now));
  const todayK = keyOf(today);
  const sel = selected && selected <= todayK ? selected : todayK;
  const streak = streakInfo(profile, relapses, now);
  const resetDays = relapseDayMap(relapses);
  const loggedDays = Object.values(logs).filter(isLogged).length;
  const prefs = profile.preferences;
  const lower = [
    prefs.sections.trend && <TrendCard key="trend" logs={logs} today={today} />,
    prefs.sections.strength && <HabitRatesCard key="strength" profile={profile} habits={habits} logs={logs} today={today} />,
    prefs.sections.triggers && <TriggersCard key="triggers" relapses={relapses} />,
  ].filter(Boolean);

  function pickDay(k: string) {
    setSelected(k === todayK ? null : k);
  }

  return (
    <>
      <SiteHeader>
        <nav className="mr-2 hidden gap-0.5 md:flex">
          {[
            ["#today", "Today"],
            ["#progress", "Progress"],
            ["#journal", "Journal"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <SyncPill sync={sync} />
        <Link href="/settings" className="icon-btn" aria-label="Settings">
          <SettingsIcon />
        </Link>
      </SiteHeader>

      <section className="night">
        <div className="wrap grid gap-7 pt-9 pb-10 md:pt-12">
          <Hero
            profile={profile}
            streak={streak}
            onSos={() => setDialog("sos")}
            onReset={() => setDialog("reset")}
          />
          {prefs.sections.milestones && <Milestones goal={profile.goalDays} streak={streak} rewards={prefs.rewards} />}
        </div>
      </section>

      <main className="wrap grid gap-5 pt-6 pb-28 md:pb-16">
        {loggedDays < 3 && <WelcomeGuide />}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <TodayCard
            key={sel}
            date={sel}
            todayKey={todayK}
            profile={profile}
            habits={habits}
            logs={logs}
            isResetDay={Boolean(resetDays[sel])}
            onChange={(fn) => updateDay(sel, fn)}
            onPick={pickDay}
          />
          <StatsCard profile={profile} relapses={relapses} logs={logs} habits={habits} streak={streak} today={today} showWeek={prefs.sections.week} />
        </div>
        {prefs.sections.map && (
        <HeatmapCard
          profile={profile}
          habits={habits}
          logs={logs}
          resetDays={resetDays}
          today={today}
          selected={sel}
          onPick={(k) => {
            pickDay(k);
            document.getElementById("today")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
        )}
        {lower.length > 0 && (
          <div className={`grid items-start gap-5 ${lower.length === 3 ? "lg:grid-cols-3" : lower.length === 2 ? "lg:grid-cols-2" : ""}`}>{lower}</div>
        )}
        {prefs.sections.journal && (
        <JournalCard
          logs={logs}
          relapses={relapses}
          onOpen={(k) => {
            pickDay(k);
            document.getElementById("today")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
        )}
      </main>

      <ThemeApplier theme={prefs.theme} accent={prefs.accent} />
      <BottomNav onSos={() => setDialog("sos")} />

      <SosDialog
        open={dialog === "sos"}
        onClose={() => setDialog(null)}
        reasons={profile.reasons}
        actions={prefs.sosActions}
        breathing={prefs.breathing}
        onWin={() => {
          updateDay(todayK, (l) => ({ ...l, resisted: l.resisted + 1 }));
          setDialog(null);
          toast("Logged as an urge beaten. That's the work.");
        }}
      />
      <ResetDialog
        open={dialog === "reset"}
        onClose={() => setDialog(null)}
        startAt={profile.startAt}
        triggers={prefs.triggers}
        onLogged={(r) => {
          setRelapses((prev) => [...prev, r].sort((a, b) => a.at.localeCompare(b.at)));
          setDialog(null);
          toast("Logged. The clock starts again now. You've done this before.");
        }}
      />
    </>
  );
}

function SyncPill({ sync }: { sync: Sync }) {
  const label = { saved: "All changes saved", saving: "Saving…", error: "Not saved" }[sync];
  const dot = { saved: "bg-good", saving: "bg-accent animate-[pulse-dot_1s_infinite]", error: "bg-bad" }[sync];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] whitespace-nowrap text-muted"
      title={label}
      aria-live="polite"
    >
      <i className={`h-[7px] w-[7px] rounded-full ${dot}`} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <SiteHeader />
      <div className="wrap grid gap-5 py-8" aria-label="Loading your tracker">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="h-[240px] w-[240px] animate-pulse rounded-full border-[14px] border-heat-0" />
          <div className="grid w-full max-w-xl gap-3">
            <div className="h-10 w-3/4 animate-pulse rounded-lg bg-heat-0" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-heat-0" />
            <div className="h-8 w-1/2 animate-pulse rounded-lg bg-heat-0" />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card h-[520px] animate-pulse" />
          <div className="card h-[300px] animate-pulse" />
        </div>
      </div>
    </>
  );
}

const WELCOME_KEY = "reclaim180:welcome-dismissed";

/** A short guide for people who just started. Hidden once dismissed or after a few check-ins. */
function WelcomeGuide() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(WELCOME_KEY) === "1";
    } catch {
      return false;
    }
  });
  if (hidden) return null;
  const items = [
    { Icon: CircleCheckIcon, title: "Check in once a day", body: "Tick your habits and say how the day felt. It saves on its own." },
    { Icon: DropIcon, title: "Use SOS when an urge hits", body: "A breathing guide and your own reasons, one tap away." },
    { Icon: ResetIcon, title: "If you slip, log it honestly", body: "Your history stays, and the trigger helps you plan for next time." },
  ];
  return (
    <section className="card relative border-accent/30 bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))]" aria-label="Getting started">
      <button
        type="button"
        className="icon-btn absolute top-3 right-3 !h-8 !w-8"
        aria-label="Hide this guide"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(WELCOME_KEY, "1");
          } catch {}
        }}
      >
        <XIcon />
      </button>
      <div className="eyebrow !text-accent">Getting started</div>
      <h2 className="mt-0.5 text-[20px] font-bold">Here&apos;s how to use Reclaim 180</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map(({ Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-accent-soft">
              <Icon className="h-5 w-5 text-accent" />
            </span>
            <span>
              <b className="block text-[14.5px]">{title}</b>
              <span className="text-[13.5px] text-muted">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Phone-only navigation, with SOS in the middle where a thumb finds it. */
function BottomNav({ onSos }: { onSos: () => void }) {
  const link = "grid justify-items-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-semibold whitespace-nowrap text-muted active:bg-surface-2";
  return (
    <nav className="bottom-nav md:hidden" aria-label="Sections">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        <a href="#top" className={link} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <HomeIcon className="h-[22px] w-[22px]" />
          Home
        </a>
        <a href="#today" className={link}>
          <CircleCheckIcon className="h-[22px] w-[22px]" />
          Today
        </a>
        <button type="button" onClick={onSos} className="grid justify-items-center gap-0.5 text-[11px] font-bold text-accent" aria-label="Urge SOS">
          <span className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_8px_24px_-6px_var(--glow)] ring-4 ring-bg">
            <DropIcon className="h-6 w-6" />
          </span>
          SOS
        </button>
        <a href="#progress" className={link}>
          <ChartIcon className="h-[22px] w-[22px]" />
          Progress
        </a>
        <Link href="/settings" className={link}>
          <SettingsIcon className="h-[22px] w-[22px]" />
          Settings
        </Link>
      </div>
    </nav>
  );
}
