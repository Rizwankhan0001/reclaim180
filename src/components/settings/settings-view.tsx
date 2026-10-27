"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { deleteRelapse, eraseAll, importBackup, saveSettings } from "@/app/actions";
import { ChevronLeft, DownloadIcon, XIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { ThemeApplier } from "@/components/theme-applier";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { useIsClient } from "@/lib/hooks";
import { GOAL_OPTIONS, SOS_ACTIONS, TRIGGERS } from "@/lib/tracker/constants";
import { fromLocalInput, toLocalInput } from "@/lib/tracker/dates";
import { milestones } from "@/lib/tracker/math";
import {
  ACCENTS,
  BREATHING,
  CHECKIN_FIELDS,
  DASHBOARD_SECTIONS,
  THEMES,
  type Preferences,
} from "@/lib/tracker/preferences";
import type { Habit, Relapse, TrackerData } from "@/lib/tracker/types";
import { ListEditor, Section, Toggle } from "./controls";
import { HabitEditor, type HabitRow } from "./habit-editor";

const NAV = [
  ["profile", "Profile and goal"],
  ["habits", "Habits"],
  ["checkin", "Daily check-in"],
  ["dashboard", "Dashboard"],
  ["appearance", "Appearance"],
  ["motivation", "Motivation"],
  ["sos", "Urge SOS"],
  ["resets", "Resets"],
  ["data", "Data and account"],
] as const;

/** True if a date is more than a minute in the future. */
const isFuture = (d: Date) => d.getTime() > Date.now() + 60_000;

type Draft = {
  displayName: string;
  startLocal: string;
  goalDays: number;
  reasons: string[];
  habits: HabitRow[];
  prefs: Preferences;
};

function toDraft(d: TrackerData): Draft {
  return {
    displayName: d.profile.displayName,
    startLocal: toLocalInput(new Date(d.profile.startAt)),
    goalDays: d.profile.goalDays,
    reasons: d.profile.reasons,
    habits: d.habits.map((h) => ({ key: h.id, id: h.id, name: h.name, kind: h.kind, target: h.target, unit: h.unit, icon: h.icon, days: h.days })),
    prefs: d.profile.preferences,
  };
}

export function SettingsView(props: { initial: TrackerData; email: string }) {
  return (
    <ToastProvider>
      <SettingsInner {...props} />
    </ToastProvider>
  );
}

function SettingsInner({ initial, email }: { initial: TrackerData; email: string }) {
  const isClient = useIsClient();
  if (!isClient) {
    return (
      <>
        <SiteHeader />
        <div className="wrap py-10">
          <div className="card h-[600px] animate-pulse" />
        </div>
      </>
    );
  }
  return <SettingsForm initial={initial} email={email} />;
}

function SettingsForm({ initial, email }: { initial: TrackerData; email: string }) {
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState<Draft>(() => toDraft(initial));
  const [draft, setDraft] = useState<Draft>(saved);
  const [relapses, setRelapses] = useState<Relapse[]>(initial.relapses);
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setPref = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setDraft((d) => ({ ...d, prefs: { ...d.prefs, [k]: v } }));

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const goalIsPreset = GOAL_OPTIONS.some((g) => g.days === draft.goalDays);
  const rewardDays = milestones(draft.goalDays);

  function save() {
    setError(null);
    const start = fromLocalInput(draft.startLocal);
    if (!start || isFuture(start)) return setError("Pick a program start that isn't in the future.");
    const unnamed = draft.habits.find((h) => !h.name.trim());
    if (unnamed) return setError("Every habit needs a name.");
    const rewards = Object.fromEntries(Object.entries(draft.prefs.rewards).filter(([k, v]) => v.trim() && rewardDays.includes(Number(k))));
    const payload = {
      displayName: draft.displayName.trim(),
      startAt: start.toISOString(),
      goalDays: draft.goalDays,
      reasons: draft.reasons,
      habits: draft.habits.map(({ id, name, kind, target, unit, icon, days }) => ({
        ...(id ? { id } : {}),
        name: name.trim(),
        kind,
        target: kind === "count" ? target : 1,
        unit: kind === "count" ? unit?.trim() || "per day" : null,
        icon: icon ?? null,
        days: days ?? null,
      })),
      preferences: { ...draft.prefs, rewards },
    };
    startTransition(async () => {
      const res = await saveSettings(payload);
      if (!res.ok) return setError(res.error);
      const habits: Habit[] = res.data;
      const next: Draft = {
        ...draft,
        prefs: { ...draft.prefs, rewards },
        habits: habits.map((h) => ({ key: h.id, id: h.id, name: h.name, kind: h.kind, target: h.target, unit: h.unit, icon: h.icon, days: h.days })),
      };
      setSaved(next);
      setDraft(next);
      toast("Settings saved.");
      router.refresh();
    });
  }

  function onImport(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const res = await importBackup(await file.text());
      if (!res.ok) return setError(res.error);
      window.location.reload();
    });
  }

  function onErase() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    startTransition(async () => {
      const res = await eraseAll();
      if (!res.ok) return setError(res.error);
      router.replace("/onboarding");
      router.refresh();
    });
  }

  function onRemoveReset(id: string) {
    startTransition(async () => {
      const res = await deleteRelapse(id);
      if (!res.ok) return setError(res.error);
      setRelapses((rs) => rs.filter((r) => r.id !== id));
      toast("Reset removed.");
    });
  }

  async function onSignOut() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <ThemeApplier theme={draft.prefs.theme} accent={draft.prefs.accent} />
      <SiteHeader>
        <Link href="/dashboard" className="btn btn-quiet !px-2.5 !py-2">
          <ChevronLeft /> Dashboard
        </Link>
      </SiteHeader>

      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-6 pt-6 pb-32 sm:pt-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">Settings</h1>
          <p className="mt-1 text-[14px] text-muted">Make the tracker yours.</p>
          <nav
            className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:sticky lg:top-20 lg:mx-0 lg:mt-6 lg:grid lg:gap-0.5 lg:overflow-visible lg:px-0"
            aria-label="Settings sections"
          >
            {NAV.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex-none rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium whitespace-nowrap text-muted hover:text-ink lg:rounded-lg lg:border-transparent lg:bg-transparent lg:px-3 lg:hover:bg-surface"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="grid min-w-0 gap-5">
          {/* ------------------------------------------------ profile */}
          <Section id="profile" title="Profile and goal" description="Your name, your target, and when your program began.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="s-name">Name</label>
                <input id="s-name" className="input" value={draft.displayName} maxLength={40} onChange={(e) => set("displayName", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="s-start">Program start</label>
                <input id="s-start" type="datetime-local" className="input" value={draft.startLocal} onChange={(e) => set("startLocal", e.target.value)} />
              </div>
            </div>
            <div className="field">
              <span className="lbl">Goal</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {GOAL_OPTIONS.map((g) => (
                  <button key={g.days} type="button" className="opt" aria-pressed={draft.goalDays === g.days} onClick={() => set("goalDays", g.days)}>
                    {g.label}
                  </button>
                ))}
                <span className="ml-2 inline-flex items-center gap-2 text-[13.5px] text-muted">
                  or
                  <input
                    type="number"
                    min={7}
                    max={1000}
                    aria-label="Custom goal in days"
                    className={`input !w-24 !py-1.5 ${goalIsPreset ? "" : "!border-accent"}`}
                    value={draft.goalDays}
                    onChange={(e) => set("goalDays", Math.max(7, Math.min(1000, Math.round(Number(e.target.value) || 7))))}
                  />
                  days
                </span>
              </div>
            </div>
          </Section>

          {/* ------------------------------------------------ habits */}
          <Section id="habits" title="Habits" description="Pick an icon, set a daily goal for counted habits, and choose which days each habit applies to. Days off don't count against you.">
            <HabitEditor rows={draft.habits} onChange={(rows) => set("habits", rows)} weekStart={draft.prefs.weekStart} />
          </Section>

          {/* ------------------------------------------------ check-in */}
          <Section id="checkin" title="Daily check-in" description="Choose what you're asked each day. Keep it as short as you like.">
            <div className="grid gap-2 sm:grid-cols-2">
              {CHECKIN_FIELDS.map((f) => (
                <Toggle
                  key={f.key}
                  label={f.label}
                  description={f.desc}
                  checked={draft.prefs.checkin[f.key]}
                  onChange={(v) => setPref("checkin", { ...draft.prefs.checkin, [f.key]: v })}
                />
              ))}
            </div>
          </Section>

          {/* ------------------------------------------------ dashboard */}
          <Section id="dashboard" title="Dashboard" description="Show only the parts you find useful.">
            <div className="grid gap-2 sm:grid-cols-2">
              {DASHBOARD_SECTIONS.map((f) => (
                <Toggle
                  key={f.key}
                  label={f.label}
                  description={f.desc}
                  checked={draft.prefs.sections[f.key]}
                  onChange={(v) => setPref("sections", { ...draft.prefs.sections, [f.key]: v })}
                />
              ))}
            </div>
            <div className="field">
              <span className="lbl">Week starts on</span>
              <div className="flex gap-1.5">
                {([
                  [1, "Monday"],
                  [0, "Sunday"],
                ] as const).map(([v, l]) => (
                  <button key={v} type="button" className="opt" aria-pressed={draft.prefs.weekStart === v} onClick={() => setPref("weekStart", v)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ------------------------------------------------ appearance */}
          <Section id="appearance" title="Appearance" description="Changes preview right away. Save to keep them.">
            <div className="field">
              <span className="lbl">Theme</span>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => {
                  const on = draft.prefs.theme === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPref("theme", t.key)}
                      className={`grid gap-2 rounded-2xl border-2 p-2 text-left sm:p-3 ${on ? "border-accent" : "border-line hover:border-faint"}`}
                    >
                      <span className="flex h-12 overflow-hidden rounded-lg border border-line sm:h-14" aria-hidden="true">
                        {t.key !== "dark" && (
                          <span className="min-w-0 flex-1 bg-[#edf1f4] p-2">
                            <i className="block h-2 w-1/2 rounded bg-[#cfd8e0]" />
                            <i className="mt-1.5 block h-2 w-3/4 rounded bg-accent" />
                          </span>
                        )}
                        {t.key !== "light" && (
                          <span className="min-w-0 flex-1 bg-[#0b1118] p-2">
                            <i className="block h-2 w-1/2 rounded bg-[#2a3a4c]" />
                            <i className="mt-1.5 block h-2 w-3/4 rounded bg-accent" />
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] font-semibold sm:text-[14px]">
                        {t.label}
                        {t.key === "system" && <span className="hidden font-normal text-muted sm:inline"> (match device)</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="field">
              <span className="lbl">Accent color</span>
              <div className="grid max-w-[360px] grid-cols-5 gap-2 sm:gap-3">
                {ACCENTS.map((a) => {
                  const on = draft.prefs.accent === a.key;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPref("accent", a.key)}
                      className="grid min-w-0 justify-items-center gap-1.5 text-[11.5px] font-semibold sm:text-[12.5px]"
                    >
                      <span
                        className={`aspect-square w-full max-w-11 rounded-full ring-offset-2 ring-offset-surface transition ${on ? "ring-2 ring-ink" : ""}`}
                        style={{ background: a.swatch }}
                      />
                      <span className={on ? "text-ink" : "text-muted"}>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* ------------------------------------------------ motivation */}
          <Section id="motivation" title="Motivation" description="Words and rewards that keep you going.">
            <div className="field">
              <label htmlFor="s-mantra">Your mantra</label>
              <input
                id="s-mantra"
                className="input"
                placeholder="e.g. Discipline is choosing what I want most over what I want now."
                value={draft.prefs.mantra}
                maxLength={120}
                onChange={(e) => setPref("mantra", e.target.value)}
              />
              <span className="hint">Shown at the top of your dashboard.</span>
            </div>
            <div className="field">
              <span className="lbl">Your reasons</span>
              <span className="hint -mt-1">These appear on the SOS screen when an urge hits.</span>
              <ListEditor
                variant="rows"
                items={draft.reasons}
                onChange={(v) => set("reasons", v)}
                max={12}
                maxLength={200}
                placeholder="Add a reason"
                emptyText="No reasons yet."
              />
            </div>
            <div className="field">
              <span className="lbl">Milestone rewards</span>
              <span className="hint -mt-1">Promise yourself something for each milestone. It shows when you get close and when you reach it.</span>
              <ul className="grid gap-2 sm:grid-cols-2">
                {rewardDays.map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="num w-[76px] flex-none rounded-lg bg-accent-soft px-2 py-2.5 text-center text-[12.5px] font-semibold whitespace-nowrap">
                      {m} {m === 1 ? "day" : "days"}
                    </span>
                    <input
                      className="input !py-2"
                      aria-label={`Reward for ${m} days`}
                      placeholder="Reward (optional)"
                      maxLength={80}
                      value={draft.prefs.rewards[String(m)] ?? ""}
                      onChange={(e) => setPref("rewards", { ...draft.prefs.rewards, [String(m)]: e.target.value })}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* ------------------------------------------------ SOS */}
          <Section id="sos" title="Urge SOS" description="Set up the screen you see when an urge hits.">
            <div className="field">
              <span className="lbl">Breathing pattern</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {BREATHING.map((b) => {
                  const on = draft.prefs.breathing === b.key;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPref("breathing", b.key)}
                      className={`grid content-start gap-1 rounded-2xl border-2 p-3.5 text-left ${on ? "border-accent bg-accent-soft" : "border-line bg-surface-2 hover:border-faint"}`}
                    >
                      <span className="text-[14.5px] font-bold">{b.label}</span>
                      <span className="text-[12.5px] text-muted">{b.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="field">
              <div className="flex items-center justify-between">
                <span className="lbl">Quick actions</span>
                <button type="button" className="-my-1 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-accent hover:bg-accent-soft" onClick={() => setPref("sosActions", [...SOS_ACTIONS])}>
                  Restore defaults
                </button>
              </div>
              <ListEditor
                items={draft.prefs.sosActions}
                onChange={(v) => setPref("sosActions", v)}
                max={12}
                maxLength={40}
                placeholder="e.g. Call my brother"
                emptyText="No quick actions. Add things that pull you out of the moment."
              />
            </div>
          </Section>

          {/* ------------------------------------------------ resets */}
          <Section id="resets" title="Resets" description="The triggers you can pick from when you log a reset, and your reset history.">
            <div className="field">
              <div className="flex items-center justify-between">
                <span className="lbl">Triggers</span>
                <button type="button" className="-my-1 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-accent hover:bg-accent-soft" onClick={() => setPref("triggers", [...TRIGGERS])}>
                  Restore defaults
                </button>
              </div>
              <ListEditor
                items={draft.prefs.triggers}
                onChange={(v) => setPref("triggers", v)}
                max={16}
                maxLength={30}
                placeholder="e.g. After gaming"
                emptyText="No triggers. You can still log resets without one."
              />
            </div>
            <div className="field">
              <span className="lbl">Logged resets</span>
              {relapses.length === 0 ? (
                <p className="empty !py-3">No resets logged.</p>
              ) : (
                <ul className="grid gap-1.5">
                  {[...relapses].reverse().map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3.5 py-2 text-[13.5px]">
                      <span>
                        {new Date(r.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        {r.trigger && <span className="text-muted"> · {r.trigger}</span>}
                      </span>
                      <button type="button" className="icon-btn !h-8 !w-8" aria-label="Delete this reset" disabled={pending} onClick={() => onRemoveReset(r.id)}>
                        <XIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <span className="hint">Deleting a reset takes effect right away.</span>
            </div>
          </Section>

          {/* ------------------------------------------------ data */}
          <Section id="data" title="Data and account" description={`Signed in as ${email}.`}>
            <div className="flex flex-wrap gap-2">
              <a className="btn" href="/api/export" download>
                <DownloadIcon /> Export backup
              </a>
              <label className="btn cursor-pointer">
                Import backup
                <input type="file" accept="application/json,.json" className="sr-only" disabled={pending} onChange={(e) => onImport(e.target.files?.[0])} />
              </label>
              <button type="button" className="btn btn-quiet" onClick={onSignOut}>
                Sign out
              </button>
            </div>
            <p className="hint -mt-2">Importing replaces everything currently in your tracker.</p>
            <div className="grid gap-2 rounded-2xl border border-bad/30 bg-bad/[0.04] p-4">
              <b className="text-[14.5px]">Erase all tracker data</b>
              <span className="text-[13px] text-muted">Deletes your habits, check-ins, resets and settings. Your account stays so you can start again.</span>
              <div>
                <button type="button" className={`btn btn-danger ${armed ? "armed" : ""}`} disabled={pending} onClick={onErase}>
                  {armed ? "Click again to erase everything" : "Erase everything"}
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* save bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md transition-transform duration-200 ${
          dirty || error ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-hidden={!dirty && !error}
      >
        <div className="wrap flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
          <span className={`text-[14px] font-medium ${error ? "text-bad" : "text-muted"}`} role={error ? "alert" : undefined}>
            {error ?? "You have unsaved changes."}
          </span>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              className="btn flex-1 sm:flex-none"
              disabled={pending || !dirty}
              onClick={() => {
                setDraft(saved);
                setError(null);
              }}
            >
              Discard
            </button>
            <button type="button" className="btn btn-primary flex-1 sm:flex-none" disabled={pending || !dirty} onClick={save}>
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
