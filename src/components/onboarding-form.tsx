"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createProfile, importBackup } from "@/app/actions";
import { GOAL_OPTIONS, HABIT_LIBRARY } from "@/lib/tracker/constants";
import { fromLocalInput, toLocalInput } from "@/lib/tracker/dates";
import { useIsClient } from "@/lib/hooks";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const isClient = useIsClient();
  const [goal, setGoal] = useState(182);
  const [picked, setPicked] = useState(() => new Set(HABIT_LIBRARY.filter((h) => h.suggested).map((h) => h.key)));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const start = fromLocalInput(String(f.get("start") ?? "")) ?? new Date();
    const input = {
      displayName: String(f.get("displayName") ?? "").trim(),
      startAt: start.toISOString(),
      goalDays: goal,
      reasons: String(f.get("reasons") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
      habits: HABIT_LIBRARY.filter((h) => picked.has(h.key)).map(({ name, kind, target, unit }) => ({
        name,
        kind,
        target,
        unit,
      })),
    };
    startTransition(async () => {
      const res = await createProfile(input);
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

  if (!isClient) return <div className="card h-[620px] animate-pulse" aria-label="Loading" />;

  return (
    <form onSubmit={onSubmit} className="card grid content-start gap-5">
      <div className="field">
        <label htmlFor="displayName">What should we call you?</label>
        <input
          id="displayName"
          name="displayName"
          className="input"
          defaultValue={defaultName}
          maxLength={40}
          autoComplete="given-name"
        />
      </div>
      <div className="field">
        <label htmlFor="start">When did your current streak start?</label>
        <input
          id="start"
          name="start"
          type="datetime-local"
          className="input"
          defaultValue={toLocalInput(new Date())}
          max={toLocalInput(new Date())}
        />
        <span className="hint">Leave it as now if today is day one.</span>
      </div>
      <div className="field">
        <span className="lbl">Goal</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Goal">
          {GOAL_OPTIONS.map((g) => (
            <button key={g.days} type="button" className="opt" aria-pressed={goal === g.days} onClick={() => setGoal(g.days)}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="lbl">Daily habits to track</span>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {HABIT_LIBRARY.map((h) => (
            <label
              key={h.key}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-[13.5px] font-semibold"
            >
              <input
                type="checkbox"
                checked={picked.has(h.key)}
                onChange={() => toggle(h.key)}
                className="h-4 w-4 accent-heat-3"
              />
              {h.name}
              {h.kind === "count" && <span className="font-normal text-muted">({h.target} {h.unit})</span>}
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="reasons">Why are you doing this?</label>
        <textarea
          id="reasons"
          name="reasons"
          className="input"
          placeholder={"One reason per line. These show up when an urge hits.\ne.g. I want my focus back"}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="btn btn-quiet cursor-pointer !px-2">
          Import a backup instead
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => onImport(e.target.files?.[0])}
            disabled={pending}
          />
        </label>
        <button type="submit" className="btn btn-primary !px-5 !py-3" disabled={pending}>
          {pending ? "Setting up…" : "Start tracking"}
        </button>
      </div>
    </form>
  );
}
