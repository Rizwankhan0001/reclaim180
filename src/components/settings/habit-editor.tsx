"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, PlusIcon, XIcon } from "@/components/icons";
import { HABIT_ICONS, HabitIcon } from "@/components/habit-icon";
import { HABIT_LIBRARY } from "@/lib/tracker/constants";
import type { HabitDraft } from "@/lib/tracker/types";

export type HabitRow = HabitDraft & { key: string };

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let nextKey = 0;
export const newRowKey = () => `new-${Date.now()}-${nextKey++}`;

export function HabitEditor({
  rows,
  onChange,
  weekStart,
}: {
  rows: HabitRow[];
  onChange: (rows: HabitRow[]) => void;
  weekStart: 0 | 1;
}) {
  const [iconFor, setIconFor] = useState<string | null>(null);
  const order = weekStart === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];

  const update = (key: string, patch: Partial<HabitRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const toggleDay = (r: HabitRow, d: number) => {
    const cur = r.days && r.days.length ? r.days : [0, 1, 2, 3, 4, 5, 6];
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
    update(r.key, { days: next.length === 7 ? null : next.length === 0 ? cur : next.sort() });
  };
  const suggestions = HABIT_LIBRARY.filter((h) => !rows.some((r) => r.name.toLowerCase() === h.name.toLowerCase()));

  return (
    <div className="grid gap-3">
      {rows.length === 0 && <p className="empty">No habits yet. Add one below.</p>}
      <ul className="grid gap-3">
        {rows.map((r, i) => {
          const every = !r.days || r.days.length === 0 || r.days.length === 7;
          return (
            <li key={r.key} className="grid min-w-0 gap-3 rounded-2xl border border-line bg-surface-2 p-3 sm:p-3.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`grid h-11 w-11 flex-none place-items-center rounded-xl border bg-surface ${iconFor === r.key ? "border-accent" : "border-line"}`}
                  aria-label="Choose an icon"
                  aria-expanded={iconFor === r.key}
                  onClick={() => setIconFor((k) => (k === r.key ? null : r.key))}
                >
                  <HabitIcon name={r.name} icon={r.icon} className="h-5 w-5 text-accent" />
                </button>
                <input
                  className="input !bg-surface"
                  aria-label="Habit name"
                  placeholder="Habit name"
                  value={r.name}
                  maxLength={40}
                  onChange={(e) => update(r.key, { name: e.target.value })}
                />
              </div>

              {iconFor === r.key && (
                <div className="grid grid-cols-8 gap-1.5 rounded-xl border border-line bg-surface p-2 sm:grid-cols-[repeat(16,minmax(0,1fr))]">
                  <button
                    type="button"
                    className={`col-span-2 rounded-lg px-1 py-2 text-[11px] font-semibold sm:col-span-2 ${!r.icon ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2"}`}
                    onClick={() => {
                      update(r.key, { icon: null });
                      setIconFor(null);
                    }}
                  >
                    Auto
                  </button>
                  {HABIT_ICONS.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={r.icon === key}
                      className={`grid place-items-center rounded-lg py-2 ${r.icon === key ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                      onClick={() => {
                        update(r.key, { icon: key });
                        setIconFor(null);
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1" role="group" aria-label="Habit type">
                  {(["check", "count"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={r.kind === k}
                      className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${r.kind === k ? "bg-ink text-surface" : "text-muted hover:text-ink"}`}
                      onClick={() => update(r.key, { kind: k, target: k === "count" ? Math.max(2, r.target) : 1, unit: k === "count" ? r.unit || "times" : null })}
                    >
                      {k === "check" ? "Yes / no" : "Count"}
                    </button>
                  ))}
                </div>
                {r.kind === "count" && (
                  <div className="flex items-center gap-2 text-[13.5px]">
                    <span className="text-muted">Goal</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      aria-label="Daily goal"
                      className="input !w-20 !bg-surface !py-2"
                      value={r.target}
                      onChange={(e) => update(r.key, { target: Math.max(1, Math.min(99, Math.round(Number(e.target.value) || 1))) })}
                    />
                    <input
                      aria-label="Unit"
                      placeholder="unit"
                      className="input !w-28 !bg-surface !py-2"
                      value={r.unit ?? ""}
                      maxLength={20}
                      onChange={(e) => update(r.key, { unit: e.target.value })}
                    />
                  </div>
                )}
                <div className="ml-auto flex flex-none items-center gap-1">
                  <button type="button" className="icon-btn !h-9 !w-9 rotate-90" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ChevronLeft />
                  </button>
                  <button type="button" className="icon-btn !h-9 !w-9 rotate-90" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                    <ChevronRight />
                  </button>
                  <button type="button" className="icon-btn !h-9 !w-9" aria-label={`Remove ${r.name || "habit"}`} onClick={() => onChange(rows.filter((x) => x.key !== r.key))}>
                    <XIcon />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-muted">Repeat on</span>
                <button
                  type="button"
                  className="opt !py-1"
                  aria-pressed={every}
                  onClick={() => update(r.key, { days: null })}
                >
                  Every day
                </button>
                <div className="flex w-full justify-between gap-1 sm:w-auto sm:justify-start" role="group" aria-label="Days of the week">
                  {order.map((d) => {
                    const on = every || r.days!.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        title={DAY_NAMES[d]}
                        aria-label={DAY_NAMES[d]}
                        aria-pressed={on}
                        onClick={() => toggleDay(r, d)}
                        className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold transition-colors ${
                          on && !every ? "bg-accent text-accent-ink" : on ? "bg-accent-soft text-ink" : "border border-line bg-surface text-faint"
                        }`}
                      >
                        {DAY_LETTERS[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn"
          disabled={rows.length >= 20}
          onClick={() => onChange([...rows, { key: newRowKey(), name: "", kind: "check", target: 1, unit: null, icon: null, days: null }])}
        >
          <PlusIcon /> Add a habit
        </button>
        {suggestions.slice(0, 5).map((h) => (
          <button
            key={h.key}
            type="button"
            className="opt inline-flex items-center gap-1.5"
            disabled={rows.length >= 20}
            onClick={() => onChange([...rows, { key: newRowKey(), name: h.name, kind: h.kind, target: h.target, unit: h.unit, icon: null, days: null }])}
          >
            <PlusIcon className="h-3.5 w-3.5" /> {h.name}
          </button>
        ))}
      </div>
      <p className="hint">Removed habits are archived, so your past days keep their history. Up to 20 habits.</p>
    </div>
  );
}
