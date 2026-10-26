"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronLeft, ChevronRight } from "@/components/icons";
import { addDays, daysBetween, fmtLong, fmtShort, keyOf, parseKey } from "@/lib/tracker/dates";
import { dayScore, emptyLog, habitValue, programStart } from "@/lib/tracker/math";
import type { DayLog, Habit, Profile } from "@/lib/tracker/types";

type Props = {
  date: string;
  todayKey: string;
  profile: Profile;
  habits: Habit[];
  logs: Record<string, DayLog>;
  isResetDay: boolean;
  onChange: (fn: (log: DayLog) => DayLog) => void;
  onPick: (key: string) => void;
};

export function TodayCard({ date, todayKey, profile, habits, logs, isResetDay, onChange, onPick }: Props) {
  const log = logs[date] ?? emptyLog(date);
  const d = parseKey(date);
  const start = programStart(profile);
  const minKey = keyOf(start);
  const isToday = date === todayKey;
  const dayN = daysBetween(start, d) + 1;
  const score = dayScore(habits, log);

  const setHabit = (id: string, v: number) => onChange((l) => ({ ...l, habits: { ...l.habits, [id]: v } }));
  const setScale = (k: "mood" | "energy" | "urge", v: number) => onChange((l) => ({ ...l, [k]: l[k] === v ? null : v }));

  return (
    <section id="today" className="card scroll-mt-20" aria-labelledby="todayTitle">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">
            {isToday ? "Today" : "Editing a past day"} · Day {dayN > 0 ? dayN : "–"}
          </div>
          <h2 id="todayTitle" className="text-xl font-bold">
            {fmtLong(d)}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {isResetDay && <span className="tag tag-bad mr-1">Reset day</span>}
          <button
            type="button"
            className="icon-btn !h-8 !w-8"
            aria-label="Previous day"
            disabled={date <= minKey}
            onClick={() => onPick(keyOf(addDays(d, -1)))}
          >
            <ChevronLeft />
          </button>
          {!isToday && (
            <button type="button" className="btn btn-quiet !px-2.5 !py-1.5" onClick={() => onPick(todayKey)}>
              Today
            </button>
          )}
          <button
            type="button"
            className="icon-btn !h-8 !w-8"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => onPick(keyOf(addDays(d, 1)))}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <ul className="grid gap-1.5">
        {habits.length === 0 && <li className="empty">No habits yet. Add some in Settings.</li>}
        {habits.map((h) => {
          const v = Number(log.habits[h.id] ?? 0);
          const done = habitValue(h, log) >= 1;
          return (
            <li
              key={h.id}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[11px] border px-3 py-2.5 transition-colors ${
                done
                  ? "done border-heat-3/45 bg-[color-mix(in_oklab,var(--heat-3)_12%,var(--surface))]"
                  : "border-line bg-surface-2"
              }`}
            >
              {h.kind === "count" ? (
                <span className="check" aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : (
                <button
                  type="button"
                  className="check"
                  aria-pressed={done}
                  aria-label={h.name}
                  onClick={() => setHabit(h.id, done ? 0 : 1)}
                >
                  <CheckIcon />
                </button>
              )}
              <div className="min-w-0 text-[14.5px] font-semibold [overflow-wrap:anywhere]">
                {h.name}
                {h.kind === "count" && (
                  <small className="block text-xs font-normal text-muted">
                    {h.target} {h.unit ?? "per day"}
                  </small>
                )}
              </div>
              <div className="flex items-center gap-3">
                <WeekDots habit={h} date={d} logs={logs} />
                {h.kind === "count" && (
                  <Counter
                    value={v}
                    label={`${v}/${h.target}`}
                    name={h.name}
                    onDec={() => setHabit(h.id, Math.max(0, v - 1))}
                    onInc={() => setHabit(h.id, Math.min(99, v + 1))}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid gap-2.5">
        <Scale k="mood" label="Mood" lo="low" hi="great" value={log.mood} onPick={setScale} />
        <Scale k="energy" label="Energy" lo="drained" hi="sharp" value={log.energy} onPick={setScale} />
        <Scale k="urge" label="Urges" lo="calm" hi="intense" value={log.urge} onPick={setScale} warm />
      </div>

      <NoteField
        initial={log.note ?? ""}
        onCommit={(note) => onChange((l) => ({ ...l, note: note || null }))}
      />

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-2 text-[13px] text-muted">
          Habits done <b className="num text-[15px] text-ink">{score == null ? "0%" : `${Math.round(score * 100)}%`}</b>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="text-[13.5px] text-muted">Urges beaten</span>
          <Counter
            value={log.resisted}
            label={String(log.resisted)}
            name="urges beaten"
            onDec={() => onChange((l) => ({ ...l, resisted: Math.max(0, l.resisted - 1) }))}
            onInc={() => onChange((l) => ({ ...l, resisted: l.resisted + 1 }))}
          />
        </span>
      </div>
    </section>
  );
}

function WeekDots({ habit, date, logs }: { habit: Habit; date: Date; logs: Record<string, DayLog> }) {
  return (
    <div className="hidden gap-[3px] sm:flex" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => {
        const k = keyOf(addDays(date, i - 6));
        const v = habitValue(habit, logs[k]);
        return (
          <i
            key={k}
            title={fmtShort(parseKey(k))}
            className={`h-[7px] w-[7px] rounded-[2px] ${v >= 1 ? "bg-heat-3" : v > 0 ? "bg-heat-1" : "bg-heat-0"}`}
          />
        );
      })}
    </div>
  );
}

function Counter({
  label,
  name,
  onDec,
  onInc,
}: {
  value: number;
  label: string;
  name: string;
  onDec: () => void;
  onInc: () => void;
}) {
  const btn = "h-7 w-7 rounded-lg text-base font-bold text-muted hover:bg-surface-2 hover:text-ink";
  return (
    <span className="inline-flex items-center gap-0.5 rounded-[9px] border border-line bg-surface">
      <button type="button" className={btn} onClick={onDec} aria-label={`Less ${name}`}>
        −
      </button>
      <b className="num min-w-[42px] text-center text-[13px]">{label}</b>
      <button type="button" className={btn} onClick={onInc} aria-label={`More ${name}`}>
        +
      </button>
    </span>
  );
}

function Scale({
  k,
  label,
  lo,
  hi,
  value,
  onPick,
  warm,
}: {
  k: "mood" | "energy" | "urge";
  label: string;
  lo: string;
  hi: string;
  value: number | null;
  onPick: (k: "mood" | "energy" | "urge", v: number) => void;
  warm?: boolean;
}) {
  return (
    <div className="grid grid-cols-[82px_1fr] items-center gap-x-2.5">
      <span id={`lbl-${k}`} className="text-[13px] font-semibold text-muted">
        {label}
      </span>
      <div className={`seg5 ${warm ? "warm" : ""}`} role="group" aria-labelledby={`lbl-${k}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={value === n} onClick={() => onPick(k, n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="col-start-2 -mt-0.5 flex justify-between text-[11px] text-faint">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

/** Local state while typing; commits after a short pause so the page stays fast. */
function NoteField({ initial, onCommit }: { initial: string; onCommit: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ value: initial, onCommit, dirty: false });
  useEffect(() => {
    latest.current.onCommit = onCommit;
  });

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (latest.current.dirty) latest.current.onCommit(latest.current.value.slice(0, 5000));
    },
    [],
  );

  return (
    <div className="mt-3.5">
      <label htmlFor="dayNote" className="eyebrow mb-1.5 block">
        Journal
      </label>
      <textarea
        id="dayNote"
        className="input"
        value={value}
        maxLength={5000}
        placeholder="How did today go? What helped, what was hard?"
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          latest.current.value = v;
          latest.current.dirty = true;
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            latest.current.dirty = false;
            onCommit(v.slice(0, 5000));
          }, 500);
        }}
      />
    </div>
  );
}
