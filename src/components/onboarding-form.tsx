"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProfile, importBackup } from "@/app/actions";
import { ArrowRightIcon, CheckIcon, ChevronLeft, PlusIcon, XIcon } from "@/components/icons";
import { HabitIcon } from "@/components/habit-icon";
import { HABIT_LIBRARY } from "@/lib/tracker/constants";
import { DAY_MS } from "@/lib/tracker/dates";
import type { HabitDraft } from "@/lib/tracker/types";

const STEPS = ["Your start", "Your goal", "Daily habits", "Your why"] as const;

const GOALS = [
  { days: 90, title: "90 days", body: "A strong reset. Good if you want a shorter first target." },
  { days: 182, title: "6 months", body: "Long enough for new habits to stick and the hard phases to pass.", recommended: true },
  { days: 365, title: "1 year", body: "The full commitment. One whole year of progress on one map." },
];

const PRESETS = [
  { days: 0, label: "Starting today" },
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "1 month" },
];

const REASON_IDEAS = [
  "I want my focus back",
  "I want more energy",
  "I want to feel proud of myself",
  "I want to be present with people I care about",
  "I want better sleep",
  "I want to trust myself again",
];

type Pick = HabitDraft & { key: string };

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [daysClean, setDaysClean] = useState(0);
  const [goal, setGoal] = useState(182);
  const [habits, setHabits] = useState<Pick[]>(() =>
    HABIT_LIBRARY.map(({ key, name, kind, target, unit }) => ({ key, name, kind, target, unit })),
  );
  const [picked, setPicked] = useState(() => new Set(HABIT_LIBRARY.filter((h) => h.suggested).map((h) => h.key)));
  const [custom, setCustom] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [reasonDraft, setReasonDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleHabit(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function addCustom() {
    const n = custom.trim().slice(0, 40);
    if (!n) return;
    const key = `custom-${habits.length}`;
    setHabits((hs) => [...hs, { key, name: n, kind: "check", target: 1, unit: null }]);
    setPicked((prev) => new Set(prev).add(key));
    setCustom("");
  }

  function addReason(r: string) {
    const t = r.trim().slice(0, 200);
    if (!t || reasons.includes(t) || reasons.length >= 12) return;
    setReasons((rs) => [...rs, t]);
  }

  function finish() {
    setError(null);
    const startAt = new Date(Date.now() - daysClean * DAY_MS).toISOString();
    const chosen = habits.filter((h) => picked.has(h.key)).map(({ name, kind, target, unit }) => ({ name, kind, target, unit }));
    startTransition(async () => {
      const res = await createProfile({ displayName: name.trim(), startAt, goalDays: goal, reasons, habits: chosen });
      if (!res.ok) return setError(res.error);
      router.replace("/dashboard");
      router.refresh();
    });
  }

  function onImport(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const res = await importBackup(await file.text());
      if (!res.ok) return setError(res.error);
      router.replace("/dashboard");
      router.refresh();
    });
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="mx-auto w-full max-w-[680px]">
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold">
            Step {step + 1} of {STEPS.length} · <span className="text-muted">{STEPS[step]}</span>
          </span>
          <span className="num text-faint">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-heat-0"}`} />
          ))}
        </div>
      </div>

      <div className="card !p-6 shadow-lift sm:!p-8" key={step}>
        <div className="animate-[float-in_0.35s_ease_both]">
          {step === 0 && (
            <div className="grid gap-6">
              <Heading title="Let's set up your tracker" sub="It takes about a minute. You can change everything later." />
              <div className="field">
                <label htmlFor="displayName">What should we call you?</label>
                <input
                  id="displayName"
                  className="input"
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Your first name"
                />
              </div>
              <div className="field">
                <span className="lbl">How many days clean are you right now?</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick picks">
                  {PRESETS.map((p) => (
                    <button key={p.days} type="button" className="opt" aria-pressed={daysClean === p.days} onClick={() => setDaysClean(p.days)}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="inline-flex items-center rounded-xl border border-line bg-surface-2">
                    <button type="button" className="h-11 w-11 text-xl font-bold text-muted hover:text-ink" aria-label="One day less" onClick={() => setDaysClean((d) => Math.max(0, d - 1))}>
                      −
                    </button>
                    <input
                      id="daysClean"
                      type="number"
                      min={0}
                      max={999}
                      inputMode="numeric"
                      aria-label="Days clean"
                      className="num w-16 bg-transparent text-center text-xl font-semibold outline-none"
                      value={daysClean}
                      onChange={(e) => setDaysClean(Math.max(0, Math.min(999, Math.round(Number(e.target.value) || 0))))}
                    />
                    <button type="button" className="h-11 w-11 text-xl font-bold text-muted hover:text-ink" aria-label="One day more" onClick={() => setDaysClean((d) => Math.min(999, d + 1))}>
                      +
                    </button>
                  </div>
                  <span className="text-[14px] text-muted">
                    {daysClean === 0 ? "Your streak starts now." : `Your streak starts ${daysClean} day${daysClean === 1 ? "" : "s"} ago.`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-6">
              <Heading title="Pick your goal" sub="This sets the length of your progress ring and calendar." />
              <div className="grid gap-3 sm:grid-cols-3">
                {GOALS.map((g) => {
                  const on = goal === g.days;
                  return (
                    <button
                      key={g.days}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setGoal(g.days)}
                      className={`relative grid content-start gap-2 rounded-2xl border-2 p-4 text-left transition-colors ${
                        on ? "border-accent bg-accent-soft" : "border-line bg-surface-2 hover:border-faint"
                      }`}
                    >
                      {g.recommended && (
                        <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">
                          Recommended
                        </span>
                      )}
                      <span className="font-display text-2xl font-extrabold">{g.title}</span>
                      <span className="text-[13.5px] text-muted">{g.body}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5">
              <Heading title="Choose your daily habits" sub="These hold your streak up. Four to seven is a good number to start with." />
              <div className="grid gap-2 sm:grid-cols-2">
                {habits.map((h) => {
                  const on = picked.has(h.key);
                  return (
                    <button
                      key={h.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleHabit(h.key)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-[14px] font-semibold transition-colors ${
                        on ? "done border-heat-3/50 bg-[color-mix(in_oklab,var(--heat-3)_12%,var(--surface))]" : "border-line bg-surface-2 hover:border-faint"
                      }`}
                    >
                      <span className="check !h-6 !w-6">
                        <CheckIcon />
                      </span>
                      <HabitIcon name={h.name} className="h-5 w-5 flex-none text-muted" />
                      <span className="min-w-0 flex-1 truncate">{h.name}</span>
                      {h.kind === "count" && <span className="text-[12px] font-normal text-muted">{h.target} {h.unit}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Add your own, e.g. 20 push-ups"
                  value={custom}
                  maxLength={40}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                />
                <button type="button" className="btn" onClick={addCustom} disabled={!custom.trim()}>
                  <PlusIcon /> Add
                </button>
              </div>
              <span className="text-[13px] text-muted">
                <b className="num text-ink">{picked.size}</b> selected
              </span>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5">
              <Heading title="Why are you doing this?" sub="Your reasons appear on screen when an urge hits. Pick some or write your own." />
              <div className="flex flex-wrap gap-1.5">
                {REASON_IDEAS.filter((r) => !reasons.includes(r)).map((r) => (
                  <button key={r} type="button" className="opt inline-flex items-center gap-1.5" onClick={() => addReason(r)}>
                    <PlusIcon className="h-3.5 w-3.5" /> {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Write your own reason"
                  value={reasonDraft}
                  maxLength={200}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addReason(reasonDraft);
                      setReasonDraft("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  disabled={!reasonDraft.trim()}
                  onClick={() => {
                    addReason(reasonDraft);
                    setReasonDraft("");
                  }}
                >
                  <PlusIcon /> Add
                </button>
              </div>
              {reasons.length > 0 ? (
                <ul className="grid gap-1.5">
                  {reasons.map((r) => (
                    <li key={r} className="flex items-center justify-between gap-2 rounded-xl bg-accent-soft py-2 pr-2 pl-3.5 text-[14.5px] font-semibold">
                      {r}
                      <button type="button" className="grid h-7 w-7 flex-none place-items-center rounded-lg hover:bg-surface/60" aria-label={`Remove "${r}"`} onClick={() => setReasons((rs) => rs.filter((x) => x !== r))}>
                        <XIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">No reasons yet. You can skip this and add them later in Settings.</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          {step === 0 ? (
            <label className="btn btn-quiet cursor-pointer !px-2">
              Import a backup instead
              <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onImport(e.target.files?.[0])} disabled={pending} />
            </label>
          ) : (
            <button type="button" className="btn btn-quiet !px-2" onClick={() => setStep((s) => s - 1)} disabled={pending}>
              <ChevronLeft /> Back
            </button>
          )}
          {last ? (
            <button type="button" className="btn btn-primary btn-glow !px-6 !py-3 max-sm:w-full" onClick={finish} disabled={pending}>
              {pending ? "Setting up…" : "Start tracking"} {!pending && <ArrowRightIcon />}
            </button>
          ) : (
            <button type="button" className="btn btn-primary !px-6 !py-3 max-sm:ml-auto" onClick={() => setStep((s) => s + 1)}>
              Continue <ArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-[clamp(26px,4vw,34px)] leading-tight font-extrabold tracking-[-0.02em]">{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{sub}</p>
    </div>
  );
}
