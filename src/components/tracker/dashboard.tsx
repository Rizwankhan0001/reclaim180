"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteRelapse, logRelapse, saveDay } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { ArrowRightIcon, ChartIcon, CircleCheckIcon, DownloadIcon, DropIcon, HomeIcon, PlusIcon, ResetIcon, SettingsIcon, XIcon } from "@/components/icons";
import { AccountMenu } from "@/components/account-menu";
import { ThemeApplier } from "@/components/theme-applier";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useIsClient, useNow } from "@/lib/hooks";
import { isSigningOut } from "@/lib/sign-out";
import { keyOf, startOfDay } from "@/lib/tracker/dates";
import { emptyLog, habitValue, isLogged, relapseDayMap, scheduledFor, streakInfo } from "@/lib/tracker/math";
import type { DayLog, Habit, Profile, Relapse, TrackerData } from "@/lib/tracker/types";
import { Hero, Milestones } from "./hero";
import { TodayCard } from "./today-card";
import { HabitRatesCard, HeatmapCard, JournalCard, StatsCard, TrendCard, TriggersCard } from "./insights";
import { ResetDialog, SosDialog, type RelapseInput } from "./dialogs";

type Sync = "saved" | "saving" | "offline" | "error" | "demo";
type DialogName = "sos" | "reset" | null;
type Mode = "live" | "demo";

export function Dashboard(props: {
  initial: TrackerData;
  mode?: Mode;
  /** localStorage key for check-ins that haven't reached the server yet (live mode only). */
  storageKey?: string;
  /** Who's signed in, for the account menu (live mode only). */
  account?: { name: string; email: string };
}) {
  return (
    <ToastProvider aboveBottomNav>
      <DashboardInner initial={props.initial} mode={props.mode ?? "live"} storageKey={props.storageKey} account={props.account} />
    </ToastProvider>
  );
}

/* ---- unsaved check-ins, kept in the browser so closing the tab while offline loses nothing ---- */

const isScale = (v: unknown) => v === null || (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5);

function isDayLog(v: unknown, date: string): v is DayLog {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return (
    l.date === date &&
    isScale(l.mood) &&
    isScale(l.energy) &&
    isScale(l.urge) &&
    Number.isInteger(l.resisted) &&
    (l.note === null || typeof l.note === "string") &&
    Boolean(l.habits) &&
    typeof l.habits === "object" &&
    Object.values(l.habits as object).every((x) => typeof x === "number")
  );
}

function sameLog(a: DayLog, b: DayLog): boolean {
  const ha = Object.entries(a.habits).filter(([, v]) => v);
  const hb = Object.entries(b.habits).filter(([, v]) => v);
  return (
    a.mood === b.mood &&
    a.energy === b.energy &&
    a.urge === b.urge &&
    a.resisted === b.resisted &&
    (a.note?.trim() || null) === (b.note?.trim() || null) &&
    ha.length === hb.length &&
    ha.every(([k, v]) => b.habits[k] === v)
  );
}

function readUnsaved(key: string): Record<string, DayLog> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!raw || typeof raw !== "object") return {};
    return Object.fromEntries(Object.entries(raw).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && isDayLog(v, k)));
  } catch {
    return {};
  }
}

function writeUnsaved(key: string, logs: Record<string, DayLog>) {
  try {
    if (Object.keys(logs).length) localStorage.setItem(key, JSON.stringify(logs));
    else localStorage.removeItem(key);
  } catch {}
}

/** Stored check-ins that differ from what the server has. */
function unsavedToReplay(key: string | undefined, server: Record<string, DayLog>): Record<string, DayLog> {
  if (!key || typeof window === "undefined") return {};
  const today = keyOf(new Date());
  return Object.fromEntries(
    Object.entries(readUnsaved(key)).filter(([k, log]) => k <= today && !sameLog(server[k] ?? emptyLog(k), log)),
  );
}

/** Which section is on screen, so the navigation can highlight it. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState("top");
  const key = ids.join(",");
  useEffect(() => {
    const list = key.split(",");
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.35;
        let cur = "top";
        for (const id of list) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= line) cur = id;
        }
        setActive(cur);
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [key]);
  return active;
}

function DashboardInner({
  initial,
  mode,
  storageKey,
  account,
}: {
  initial: TrackerData;
  mode: Mode;
  storageKey?: string;
  account?: { name: string; email: string };
}) {
  const toast = useToast();
  const isClient = useIsClient();
  const ticked = useNow(30_000);
  // Set to the current time whenever the streak changes, so it updates at once instead of on the next tick.
  const [touchedAt, setTouchedAt] = useState(0);
  const now = Math.max(ticked, touchedAt);
  const demo = mode === "demo";

  const [profile] = useState<Profile>(initial.profile);
  const [habits] = useState<Habit[]>(initial.habits);
  // Check-ins from an earlier visit that never reached the server. Read during the first client render
  // (the server render shows the skeleton, so this can't cause a hydration mismatch).
  const [replay] = useState(() => (demo ? {} : unsavedToReplay(storageKey, initial.logs)));
  const [logs, setLogs] = useState<Record<string, DayLog>>(() => ({ ...initial.logs, ...replay }));
  const [relapses, setRelapses] = useState<Relapse[]>(initial.relapses);
  const [selected, setSelected] = useState<string | null>(null); // null = today
  const [sync, setSync] = useState<Sync>(demo ? "demo" : Object.keys(replay).length ? "saving" : "saved");
  // "?sos=1" opens the urge screen straight away (the "Urge SOS" shortcut on the installed app's icon).
  const [dialog, setDialog] = useState<DialogName>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("sos") ? "sos" : null,
  );
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("sos")) return;
    url.searchParams.delete("sos");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, []);

  /* ---- background saving: debounced per day, serialized per day, retried when back online ---- */
  const logsRef = useRef(logs);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const chains = useRef(new Map<string, Promise<void>>());
  const failed = useRef(new Set<string>());
  const inflight = useRef(0);
  const warned = useRef(false);
  /** Days changed here and not yet confirmed saved. Mirrored to localStorage. */
  const unsaved = useRef(new Set<string>());

  /** Writes this tab's unsaved days, keeping any another open tab stored. `saved` is a day the server just confirmed. */
  const persistUnsaved = useCallback(
    (saved?: string) => {
      if (!storageKey) return;
      const stored = readUnsaved(storageKey);
      if (saved) delete stored[saved];
      for (const d of unsaved.current) if (logsRef.current[d]) stored[d] = logsRef.current[d];
      writeUnsaved(storageKey, stored);
    },
    [storageKey],
  );

  const settle = useCallback(() => {
    if (inflight.current === 0 && timers.current.size === 0 && failed.current.size === 0) setSync("saved");
  }, []);

  const queueSave = useCallback(
    (date: string, delay = 600) => {
      if (demo) return;
      setSync("saving");
      clearTimeout(timers.current.get(date));
      timers.current.set(
        date,
        setTimeout(() => {
          timers.current.delete(date);
          inflight.current++;
          const prev = chains.current.get(date) ?? Promise.resolve();
          const next = prev.then(async () => {
            const sent = logsRef.current[date];
            const res = await saveDay(sent).catch(() => null);
            inflight.current--;
            if (!res || !res.ok) {
              failed.current.add(date);
              const offline = !res || !navigator.onLine;
              setSync(offline ? "offline" : "error");
              if (!warned.current) {
                warned.current = true;
                toast(offline ? "You're offline. Your check-in is kept and will save when you're back." : res.error);
              }
              return;
            }
            failed.current.delete(date);
            if (failed.current.size === 0) warned.current = false;
            // Saved. Drop the browser copy, unless the day changed again while this save was in flight.
            if (logsRef.current[date] === sent && !timers.current.has(date)) {
              unsaved.current.delete(date);
              persistUnsaved(date);
            }
            settle();
          });
          chains.current.set(date, next);
        }, delay),
      );
    },
    [demo, settle, toast, persistUnsaved],
  );

  // Send check-ins left over from an earlier visit (e.g. made offline, then the tab was closed).
  useEffect(() => {
    // Stored days the server already has (saved just before the tab closed) can go.
    if (storageKey) writeUnsaved(storageKey, replay);
    const dates = Object.keys(replay);
    if (!dates.length) return;
    for (const d of dates) unsaved.current.add(d);
    const id = setTimeout(() => dates.forEach((d) => queueSave(d, 0)), 0);
    return () => clearTimeout(id);
  }, [replay, queueSave, storageKey]);

  // Retry anything that failed: when the connection comes back, and every 20 seconds meanwhile.
  useEffect(() => {
    if (demo) return;
    const retry = () => {
      const dates = [...failed.current];
      failed.current.clear();
      dates.forEach((d) => queueSave(d, 0));
    };
    const onOffline = () => {
      if (inflight.current || timers.current.size || failed.current.size) setSync("offline");
    };
    const id = setInterval(() => {
      if (failed.current.size && navigator.onLine) retry();
    }, 20_000);
    window.addEventListener("online", retry);
    window.addEventListener("offline", onOffline);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", retry);
      window.removeEventListener("offline", onOffline);
    };
  }, [demo, queueSave]);

  const updateDay = useCallback(
    (date: string, fn: (log: DayLog) => DayLog) => {
      const prev = logsRef.current[date] ?? emptyLog(date);
      logsRef.current = { ...logsRef.current, [date]: fn(prev) };
      setLogs(logsRef.current);
      if (!demo) {
        unsaved.current.add(date);
        persistUnsaved();
      }
      queueSave(date);
    },
    [demo, queueSave, persistUnsaved],
  );

  // Warn before closing the tab while something is unsaved.
  useEffect(() => {
    if (sync !== "saving" && sync !== "offline" && sync !== "error") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSigningOut()) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [sync]);

  const prefs = profile.preferences;
  const progressId = prefs.sections.map ? "progress" : "insights";
  const active = useActiveSection(["today", progressId, "journal"]);

  if (!isClient) return <DashboardSkeleton />;

  const today = startOfDay(new Date(now));
  const todayK = keyOf(today);
  const sel = selected && selected <= todayK ? selected : todayK;
  const streak = streakInfo(profile, relapses, now);
  const resetDays = relapseDayMap(relapses);
  const loggedDays = Object.values(logs).filter(isLogged).length;
  const dueToday = scheduledFor(habits, todayK);
  const todayProgress = { done: dueToday.filter((h) => habitValue(h, logs[todayK]) >= 1).length, total: dueToday.length };
  const lower = [
    prefs.sections.trend && <TrendCard key="trend" logs={logs} today={today} />,
    prefs.sections.strength && <HabitRatesCard key="strength" profile={profile} habits={habits} logs={logs} today={today} />,
    prefs.sections.triggers && <TriggersCard key="triggers" relapses={relapses} />,
  ].filter(Boolean);

  function pickDay(k: string) {
    setSelected(k === todayK ? null : k);
  }
  function openDay(k: string) {
    pickDay(k);
    document.getElementById("today")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const submitReset = async (input: RelapseInput) => {
    if (!demo) return logRelapse(input);
    const r: Relapse = { id: `demo-${Date.now()}`, at: input.at, trigger: input.trigger, note: input.note };
    return { ok: true as const, data: r };
  };

  function onResetLogged(r: Relapse) {
    setTouchedAt(Date.now());
    setRelapses((prev) => [...prev, r].sort((a, b) => a.at.localeCompare(b.at)));
    setDialog(null);
    toast("Reset logged. The clock starts again now.", {
      action: {
        label: "Undo",
        onClick: async () => {
          setTouchedAt(Date.now());
          setRelapses((prev) => prev.filter((x) => x.id !== r.id));
          if (demo) return;
          const res = await deleteRelapse(r.id).catch(() => null);
          if (!res || !res.ok) {
            setRelapses((prev) => [...prev, r].sort((a, b) => a.at.localeCompare(b.at)));
            toast("Couldn't undo that. Remove it from Settings instead.");
          } else {
            toast("Reset removed.");
          }
        },
      },
    });
  }

  const navLinks: [string, string][] = [
    ["today", "Today"],
    [progressId, "Progress"],
    ["journal", "Journal"],
  ];

  return (
    <>
      <SiteHeader>
        <nav className="mr-2 hidden gap-0.5 md:flex" aria-label="Sections">
          {navLinks.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-surface-2 hover:text-ink ${active === id ? "bg-surface-2 text-ink" : "text-muted"}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <SyncPill sync={sync} />
        {demo ? (
          <Link href="/sign-up" className="btn btn-primary !px-3.5 !py-2 !text-[13.5px]">
            Create account
          </Link>
        ) : account ? (
          <AccountMenu
            name={profile.displayName || account.name}
            email={account.email}
            confirmSignOut={() =>
              sync === "saved" ||
              window.confirm("Some of your changes haven't saved yet. If you sign out now, they'll be lost. Sign out anyway?")
            }
          />
        ) : (
          <Link href="/settings" className="icon-btn" aria-label="Settings">
            <SettingsIcon />
          </Link>
        )}
      </SiteHeader>

      {demo && (
        <div className="border-b border-accent/25 bg-accent-soft">
          <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-[13.5px]">
            <span>
              <b>You&apos;re exploring a demo with sample data.</b> <span className="text-muted">Tap anything. Nothing is saved.</span>
            </span>
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 py-1 font-semibold text-accent">
              Start my own tracker <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <section className="night">
        <div className="wrap grid gap-7 pt-8 pb-9 md:pt-12 md:pb-10">
          <Hero
            profile={profile}
            streak={streak}
            today={todayProgress}
            onSos={() => setDialog("sos")}
            onReset={() => setDialog("reset")}
          />
          {prefs.sections.milestones && <Milestones goal={profile.goalDays} streak={streak} rewards={prefs.rewards} />}
        </div>
      </section>

      <main className="wrap grid gap-5 pt-6 pb-28 md:pb-16">
        {!demo && loggedDays < 3 && <WelcomeGuide />}
        {!demo && loggedDays >= 1 && <InstallHint />}
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
            onAllDone={() => toast(sel === todayK ? "All done for today. Great work." : "That day is complete.", { tone: "success" })}
          />
          <StatsCard profile={profile} relapses={relapses} logs={logs} habits={habits} streak={streak} today={today} showWeek={prefs.sections.week} />
        </div>
        {prefs.sections.map && (
          <HeatmapCard profile={profile} habits={habits} logs={logs} resetDays={resetDays} today={today} selected={sel} onPick={openDay} />
        )}
        {lower.length > 0 && (
          <div
            id="insights"
            className={`grid scroll-mt-20 items-start gap-5 ${lower.length === 3 ? "lg:grid-cols-3" : lower.length === 2 ? "lg:grid-cols-2" : ""}`}
          >
            {lower}
          </div>
        )}
        {prefs.sections.journal && <JournalCard logs={logs} relapses={relapses} onOpen={openDay} />}
      </main>

      {!demo && <ThemeApplier theme={prefs.theme} accent={prefs.accent} remember />}
      <BottomNav onSos={() => setDialog("sos")} active={active} progressId={progressId} demo={demo} />

      <SosDialog
        open={dialog === "sos"}
        onClose={() => setDialog(null)}
        reasons={profile.reasons}
        actions={prefs.sosActions}
        breathing={prefs.breathing}
        onWin={() => {
          try {
            navigator.vibrate?.([12, 60, 12]);
          } catch {}
          updateDay(todayK, (l) => ({ ...l, resisted: l.resisted + 1 }));
          setDialog(null);
          toast("Logged as an urge beaten. That's the work.", { tone: "success" });
        }}
      />
      <ResetDialog
        open={dialog === "reset"}
        onClose={() => setDialog(null)}
        startAt={profile.startAt}
        triggers={prefs.triggers}
        submit={submitReset}
        onLogged={onResetLogged}
      />
    </>
  );
}

function SyncPill({ sync }: { sync: Sync }) {
  const label = {
    saved: "All changes saved",
    saving: "Saving…",
    offline: "Offline · will save when back",
    error: "Not saved · retrying",
    demo: "Demo · not saved",
  }[sync];
  const short = { saved: "", saving: "", offline: "Offline", error: "Retrying", demo: "Demo" }[sync];
  const dot = {
    saved: "bg-good",
    saving: "bg-accent animate-[pulse-dot_1s_infinite]",
    offline: "bg-faint",
    error: "bg-bad animate-[pulse-dot_1.6s_infinite]",
    demo: "bg-accent",
  }[sync];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border bg-surface px-2.5 py-1 text-[12.5px] whitespace-nowrap ${
        sync === "error" ? "border-bad/40 text-bad" : sync === "offline" ? "border-line text-ink" : "border-line text-muted"
      }`}
      title={label}
      role="status"
      aria-live="polite"
    >
      <i className={`h-[7px] w-[7px] rounded-full ${dot}`} />
      {short && <span className="sm:hidden">{short}</span>}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <SiteHeader />
      <div className="night">
        <div className="wrap flex flex-col items-center gap-8 py-10 md:flex-row">
          <div className="h-[190px] w-[190px] animate-pulse rounded-full border-[16px] border-white/10 md:h-[260px] md:w-[260px]" />
          <div className="grid w-full max-w-xl gap-3">
            <div className="h-10 w-3/4 animate-pulse rounded-lg bg-white/10" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-white/10" />
            <div className="h-8 w-1/2 animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      </div>
      <div className="wrap grid gap-5 py-6 lg:grid-cols-2" aria-label="Loading your tracker">
        <div className="card h-[520px] animate-pulse" />
        <div className="card h-[300px] animate-pulse" />
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
        className="icon-btn absolute top-3 right-3 !h-10 !w-10 sm:!h-8 sm:!w-8"
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
      <h2 className="mt-0.5 pr-10 text-[20px] font-bold">Here&apos;s how to use Reclaim 180</h2>
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

const INSTALL_KEY = "reclaim180:install-dismissed";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type InstallWindow = Window & { __r180Install?: InstallEvent };

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function installDismissed() {
  try {
    return localStorage.getItem(INSTALL_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * On phones, suggests adding the app to the home screen: an Install button where the browser
 * supports it (Chrome on Android), or the Share-menu steps on iPhone and iPad. Hidden once installed or dismissed.
 */
function InstallHint() {
  const [kind, setKind] = useState<"none" | "button" | "ios">(() => {
    if (installDismissed() || isInstalled() || !window.matchMedia("(pointer: coarse)").matches) return "none";
    if ((window as InstallWindow).__r180Install) return "button";
    const ua = navigator.userAgent;
    const apple = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    return apple ? "ios" : "none";
  });

  useEffect(() => {
    const installable = () => {
      if (!installDismissed() && !isInstalled() && window.matchMedia("(pointer: coarse)").matches) setKind("button");
    };
    const installed = () => setKind("none");
    window.addEventListener("r180-installable", installable);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("r180-installable", installable);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (kind === "none") return null;

  const dismiss = () => {
    setKind("none");
    try {
      localStorage.setItem(INSTALL_KEY, "1");
    } catch {}
  };
  const install = async () => {
    const e = (window as InstallWindow).__r180Install;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    (window as InstallWindow).__r180Install = undefined;
    if (outcome === "accepted") setKind("none");
  };

  return (
    <section className="card relative flex items-start gap-3 pr-14" aria-label="Install the app">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-accent-soft">
        <DownloadIcon className="h-5 w-5 text-accent" />
      </span>
      <div className="min-w-0">
        <b className="block text-[15px]">Put Reclaim 180 on your home screen</b>
        {kind === "button" ? (
          <>
            <span className="block text-[13.5px] text-muted">It opens full screen like an app, one tap away when an urge hits.</span>
            <button type="button" className="btn btn-primary mt-3 !py-2" onClick={install}>
              Install app
            </button>
          </>
        ) : (
          <span className="block text-[13.5px] text-muted">
            In Safari, tap the <b className="text-ink">Share</b> button, then <b className="text-ink">Add to Home Screen</b>. It opens full screen like an app.
          </span>
        )}
      </div>
      <button type="button" className="icon-btn absolute top-3 right-3 !h-10 !w-10 sm:!h-8 sm:!w-8" aria-label="Hide this tip" onClick={dismiss}>
        <XIcon />
      </button>
    </section>
  );
}

function NavDot({ on }: { on: boolean }) {
  return on ? <i className="absolute -top-1 h-1 w-5 rounded-full bg-accent" aria-hidden="true" /> : null;
}

/** Phone-only navigation, with SOS in the middle where a thumb finds it. Highlights the section on screen. */
function BottomNav({ onSos, active, progressId, demo }: { onSos: () => void; active: string; progressId: string; demo: boolean }) {
  const link = (on: boolean) =>
    `relative grid justify-items-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-semibold whitespace-nowrap active:bg-surface-2 ${
      on ? "text-accent" : "text-muted"
    }`;
  const onProgress = active === progressId || active === "journal";
  return (
    <nav className="bottom-nav md:hidden" aria-label="Sections">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        <a
          href="#top"
          className={link(active === "top")}
          aria-current={active === "top" ? "true" : undefined}
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <NavDot on={active === "top"} />
          <HomeIcon className="h-[22px] w-[22px]" />
          Home
        </a>
        <a href="#today" className={link(active === "today")} aria-current={active === "today" ? "true" : undefined}>
          <NavDot on={active === "today"} />
          <CircleCheckIcon className="h-[22px] w-[22px]" />
          Today
        </a>
        <button type="button" onClick={onSos} className="grid justify-items-center gap-0.5 text-[11px] font-bold text-accent" aria-label="Urge SOS">
          <span className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_8px_24px_-6px_var(--glow)] ring-4 ring-bg">
            <DropIcon className="h-6 w-6" />
          </span>
          SOS
        </button>
        <a href={`#${progressId}`} className={link(onProgress)} aria-current={onProgress ? "true" : undefined}>
          <NavDot on={onProgress} />
          <ChartIcon className="h-[22px] w-[22px]" />
          Progress
        </a>
        {demo ? (
          <Link href="/sign-up" className={link(false)}>
            <PlusIcon className="h-[22px] w-[22px]" />
            Join
          </Link>
        ) : (
          <Link href="/settings" className={link(false)}>
            <SettingsIcon className="h-[22px] w-[22px]" />
            Settings
          </Link>
        )}
      </div>
    </nav>
  );
}
