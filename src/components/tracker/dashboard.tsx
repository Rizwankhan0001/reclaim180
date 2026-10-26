"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDay } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { SettingsIcon } from "@/components/icons";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useIsClient, useNow } from "@/lib/hooks";
import { keyOf, startOfDay } from "@/lib/tracker/dates";
import { emptyLog, relapseDayMap, streakInfo } from "@/lib/tracker/math";
import type { DayLog, Habit, Profile, Relapse, TrackerData } from "@/lib/tracker/types";
import { Hero, Milestones } from "./hero";
import { TodayCard } from "./today-card";
import { HabitRatesCard, HeatmapCard, JournalCard, StatsCard, TrendCard, TriggersCard } from "./insights";
import { ResetDialog, SettingsDialog, SosDialog } from "./dialogs";

type Sync = "saved" | "saving" | "error";
type DialogName = "sos" | "reset" | "settings" | null;

export function Dashboard(props: { initial: TrackerData; email: string }) {
  return (
    <ToastProvider>
      <DashboardInner {...props} />
    </ToastProvider>
  );
}

function DashboardInner({ initial, email }: { initial: TrackerData; email: string }) {
  const toast = useToast();
  const isClient = useIsClient();
  const now = useNow(30_000);

  const [profile, setProfile] = useState<Profile>(initial.profile);
  const [habits, setHabits] = useState<Habit[]>(initial.habits);
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
        <button type="button" className="icon-btn" aria-label="Settings" onClick={() => setDialog("settings")}>
          <SettingsIcon />
        </button>
      </SiteHeader>

      <section className="wrap pt-7 pb-2">
        <Hero
          profile={profile}
          streak={streak}
          onSos={() => setDialog("sos")}
          onReset={() => setDialog("reset")}
        />
        <Milestones goal={profile.goalDays} streak={streak} />
      </section>

      <main className="wrap grid gap-5 pt-4 pb-16">
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
          <StatsCard profile={profile} relapses={relapses} logs={logs} streak={streak} today={today} />
        </div>
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
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <TrendCard logs={logs} today={today} />
          <HabitRatesCard profile={profile} habits={habits} logs={logs} today={today} />
          <TriggersCard relapses={relapses} />
        </div>
        <JournalCard
          logs={logs}
          relapses={relapses}
          onOpen={(k) => {
            pickDay(k);
            document.getElementById("today")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </main>

      <SosDialog
        open={dialog === "sos"}
        onClose={() => setDialog(null)}
        reasons={profile.reasons}
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
        onLogged={(r) => {
          setRelapses((prev) => [...prev, r].sort((a, b) => a.at.localeCompare(b.at)));
          setDialog(null);
          toast("Logged. The clock starts again now. You've done this before.");
        }}
      />
      <SettingsDialog
        open={dialog === "settings"}
        onClose={() => setDialog(null)}
        email={email}
        profile={profile}
        habits={habits}
        relapses={relapses}
        onSaved={(p, hs) => {
          setProfile(p);
          setHabits(hs);
          setDialog(null);
          toast("Settings saved.");
        }}
        onRelapseDeleted={(id) => {
          setRelapses((prev) => prev.filter((r) => r.id !== id));
          toast("Reset removed.");
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
