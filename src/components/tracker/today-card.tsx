"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronLeft, ChevronRight } from "@/components/icons";
import { HabitIcon } from "@/components/habit-icon";
import { SCALE_WORDS } from "@/lib/tracker/constants";
import { addDays, daysBetween, fmtLong, fmtShort, keyOf, parseKey } from "@/lib/tracker/dates";
import { dayScore, emptyLog, habitValue, isScheduled, programStart } from "@/lib/tracker/math";
import type { DayLog, Habit, Profile } from "@/lib/tracker/types";

type ScaleKey = "mood" | "energy" | "urge";

type Props = {
  date: string;
  todayKey: string;
  profile: Profile;
  habits: Habit[];
  logs: Record<string, DayLog>;
  isResetDay: boolean;
  onChange: (fn: (log: DayLog) => DayLog) => void;
  onPick: (key: string) => void;
  /** Called when the last scheduled habit of the day gets ticked. */
  onAllDone?: () => void;
};

const buzz = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
};

function encouragement(done: number, total: number, isToday: boolean) {
  if (total === 0) return "Add a few habits in Settings to start tracking them.";
  if (done === total) return isToday ? "Everything done. That's a great day." : "Everything done that day.";
  if (done === 0) return isToday ? "Start with the easiest one. Momentum does the rest." : "Nothing ticked yet for this day.";
  const left = total - done;
  return isToday ? `${left} to go. You've got this.` : `${left} not ticked for this day.`;
}

export function TodayCard({ date, todayKey, profile, habits, logs, isResetDay, onChange, onPick, onAllDone }: Props) {
  const [burst, setBurst] = useState(0);
  const log = logs[date] ?? emptyLog(date);
  const d = parseKey(date);
  const start = programStart(profile);
  const minKey = keyOf(start);
  const isToday = date === todayKey;
  const dayN = daysBetween(start, d) + 1;
  const due = habits.filter((h) => isScheduled(h, date));
  const notDue = habits.filter((h) => !isScheduled(h, date));
  const doneCount = due.filter((h) => habitValue(h, log) >= 1).length;
  const pct = due.length ? doneCount / due.length : 0;
  const show = profile.preferences.checkin;
  const anyScale = show.mood || show.energy || show.urge;

  const allDone = (l: DayLog) => due.length > 0 && due.every((h) => habitValue(h, l) >= 1);
  const setHabit = (id: string, v: number) => {
    const fn = (l: DayLog) => ({ ...l, habits: { ...l.habits, [id]: v } });
    const before = allDone(log);
    const after = allDone(fn(log));
    onChange(fn);
    if (v > Number(log.habits[id] ?? 0)) buzz(8);
    if (!before && after) {
      setBurst((b) => b + 1);
      buzz([12, 60, 12]);
      onAllDone?.();
    }
  };
  const setScale = (k: ScaleKey, v: number) => onChange((l) => ({ ...l, [k]: l[k] === v ? null : v }));

  return (
    <section id="today" className="card relative scroll-mt-20" aria-labelledby="todayTitle">
      {burst > 0 && <Confetti key={burst} />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">
            {isToday ? "Today's check-in" : "Editing a past day"} · Day {dayN > 0 ? dayN : "–"}
          </div>
          <h2 id="todayTitle" className="mt-0.5 text-[22px] font-bold">
            {fmtLong(d)}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {isResetDay && <span className="tag tag-bad">Reset day</span>}
          {!isToday && (
            <button type="button" className="btn !px-3 !py-1.5 !text-[13px]" onClick={() => onPick(todayKey)}>
              Back to today
            </button>
          )}
        </div>
      </div>

      <WeekStrip
        selected={date}
        todayKey={todayKey}
        minKey={minKey}
        weekStart={profile.preferences.weekStart}
        habits={habits}
        logs={logs}
        onPick={onPick}
      />

      {/* progress summary */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-surface-2 p-3.5">
        <ProgressDial pct={pct} />
        <div className="min-w-0">
          <p className="text-[15px] font-bold">
            {doneCount} of {due.length} habits done
          </p>
          <p className="text-[13.5px] text-muted">
            {due.length === 0 && habits.length > 0 ? "Nothing scheduled for this day. Enjoy the rest." : encouragement(doneCount, due.length, isToday)}
          </p>
        </div>
      </div>

      {/* habits */}
      <div className="mt-5 mb-2 flex items-center justify-between">
        <span className="eyebrow">Habits</span>
        <span className="hidden text-[11px] text-faint sm:block">Last 7 days</span>
      </div>
      <ul className="grid gap-1.5">
        {habits.length === 0 && <li className="empty">No habits yet. Add some in Settings.</li>}
        {due.map((h) => {
          const v = Number(log.habits[h.id] ?? 0);
          const done = habitValue(h, log) >= 1;
          const Row = h.kind === "count" ? "div" : "button";
          return (
            <li key={h.id}>
              <Row
                {...(h.kind === "count"
                  ? {}
                  : { type: "button" as const, "aria-pressed": done, onClick: () => setHabit(h.id, done ? 0 : 1) })}
                className={`grid w-full items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  h.kind === "count" ? "grid-cols-[auto_auto_1fr] sm:grid-cols-[auto_auto_1fr_auto]" : "grid-cols-[auto_auto_1fr_auto]"
                } ${
                  done
                    ? "done border-heat-3/45 bg-[color-mix(in_oklab,var(--heat-3)_12%,var(--surface))]"
                    : `border-line bg-surface-2 ${h.kind === "count" ? "" : "hover:border-faint"}`
                }`}
              >
                <span className="check" aria-hidden="true">
                  <CheckIcon />
                </span>
                <HabitIcon name={h.name} icon={h.icon} className={`h-5 w-5 ${done ? "text-heat-3" : "text-muted"}`} />
                <span className="min-w-0 text-[14.5px] font-semibold [overflow-wrap:anywhere]">
                  {h.name}
                  {h.kind === "count" && (
                    <small className="block text-xs font-normal text-muted">
                      Goal: {h.target} {h.unit ?? "per day"}
                    </small>
                  )}
                </span>
                <span className={`flex items-center gap-3 ${h.kind === "count" ? "col-span-3 justify-end sm:col-span-1" : ""}`}>
                  <WeekDots habit={h} date={d} logs={logs} />
                  {h.kind === "count" && (
                    <Counter
                      label={`${v}/${h.target}`}
                      name={h.name}
                      onDec={() => setHabit(h.id, Math.max(0, v - 1))}
                      onInc={() => setHabit(h.id, Math.min(99, v + 1))}
                    />
                  )}
                </span>
              </Row>
            </li>
          );
        })}
      </ul>
      {notDue.length > 0 && (
        <p className="mt-2 text-[12.5px] text-muted">
          Not scheduled {isToday ? "today" : "this day"}: {notDue.map((h) => h.name).join(", ")}
        </p>
      )}

      {/* how did it feel */}
      {anyScale && (
        <div className="mt-6 grid gap-4">
          <span className="eyebrow">How did {isToday ? "today" : "this day"} feel?</span>
          {show.mood && <Scale k="mood" label="Mood" value={log.mood} onPick={setScale} />}
          {show.energy && <Scale k="energy" label="Energy" value={log.energy} onPick={setScale} />}
          {show.urge && <Scale k="urge" label="Urges" value={log.urge} onPick={setScale} warm />}
        </div>
      )}

      {show.journal && <NoteField initial={log.note ?? ""} onCommit={(note) => onChange((l) => ({ ...l, note: note || null }))} />}

      {show.resisted && (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-3.5">
        <div className="min-w-0">
          <p className="text-[14px] font-bold">Urges beaten</p>
          <p className="text-[12.5px] text-muted">Each time you felt an urge and didn&apos;t act on it.</p>
        </div>
        <Counter
          label={String(log.resisted)}
          name="urges beaten"
          onDec={() => onChange((l) => ({ ...l, resisted: Math.max(0, l.resisted - 1) }))}
          onInc={() => onChange((l) => ({ ...l, resisted: l.resisted + 1 }))}
          big
        />
      </div>
      )}
    </section>
  );
}

function ProgressDial({ pct }: { pct: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 flex-none">
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--heat-0)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={pct >= 1 ? "var(--good)" : "var(--heat-3)"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 24 24)"
          style={{ transition: "stroke-dasharray .5s ease" }}
        />
      </svg>
      <span className="num absolute inset-0 grid place-items-center text-[12px] font-semibold">{Math.round(pct * 100)}%</span>
    </div>
  );
}

function WeekDots({ habit, date, logs }: { habit: Habit; date: Date; logs: Record<string, DayLog> }) {
  return (
    <span className="hidden gap-[3px] sm:flex" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => {
        const k = keyOf(addDays(date, i - 6));
        const v = habitValue(habit, logs[k]);
        const off = !isScheduled(habit, k);
        return (
          <i
            key={k}
            title={`${fmtShort(parseKey(k))}${off ? " · not scheduled" : ""}`}
            className={`h-[8px] w-[8px] rounded-[2.5px] ${
              off ? "border border-dashed border-faint/60" : v >= 1 ? "bg-heat-3" : v > 0 ? "bg-heat-1" : "bg-heat-0"
            }`}
          />
        );
      })}
    </span>
  );
}

function Counter({ label, name, onDec, onInc, big }: { label: string; name: string; onDec: () => void; onInc: () => void; big?: boolean }) {
  const btn = `${big ? "h-9 w-9" : "h-7 w-7"} rounded-lg text-base font-bold text-muted hover:bg-surface-2 hover:text-ink`;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-[10px] border border-line bg-surface" onClick={(e) => e.stopPropagation()}>
      <button type="button" className={btn} onClick={onDec} aria-label={`Less ${name}`}>
        −
      </button>
      <b className={`num min-w-[42px] text-center ${big ? "text-[16px]" : "text-[13px]"}`}>{label}</b>
      <button type="button" className={btn} onClick={onInc} aria-label={`More ${name}`}>
        +
      </button>
    </span>
  );
}

function Scale({
  k,
  label,
  value,
  onPick,
  warm,
}: {
  k: ScaleKey;
  label: string;
  value: number | null;
  onPick: (k: ScaleKey, v: number) => void;
  warm?: boolean;
}) {
  const words = SCALE_WORDS[k];
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <span id={`lbl-${k}`} className="text-[13.5px] font-semibold">
          {label}
        </span>
        <span className="text-[12px] text-muted">{value ? words[value - 1] : "Not set"}</span>
      </div>
      <div className={`scale-words ${warm ? "warm" : ""}`} role="group" aria-labelledby={`lbl-${k}`}>
        {words.map((w, i) => (
          <button key={w} type="button" aria-pressed={value === i + 1} onClick={() => onPick(k, i + 1)}>
            <i />
            {w}
          </button>
        ))}
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
    <div className="mt-5">
      <label htmlFor="dayNote" className="eyebrow mb-1.5 block">
        Journal
      </label>
      <textarea
        id="dayNote"
        className="input"
        value={value}
        maxLength={5000}
        placeholder="One line is enough. What helped today? What was hard?"
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

/** Seven days around the selected one, each with a small completion ring. Tap to switch day. */
function WeekStrip({
  selected,
  todayKey,
  minKey,
  weekStart,
  habits,
  logs,
  onPick,
}: {
  selected: string;
  todayKey: string;
  minKey: string;
  weekStart: 0 | 1;
  habits: Habit[];
  logs: Record<string, DayLog>;
  onPick: (key: string) => void;
}) {
  const sel = parseKey(selected);
  const first = addDays(sel, -((sel.getDay() - weekStart + 7) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(first, i));
  const clamp = (k: string) => (k > todayKey ? todayKey : k < minKey ? minKey : k);
  const prevWeek = clamp(keyOf(addDays(sel, -7)));
  const nextWeek = clamp(keyOf(addDays(sel, 7)));
  const r = 13;
  const c = 2 * Math.PI * r;

  return (
    <div className="mt-4 flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        className="icon-btn !h-9 !w-8 flex-none !border-transparent !bg-transparent"
        aria-label="Previous week"
        disabled={keyOf(first) <= minKey}
        onClick={() => onPick(prevWeek)}
      >
        <ChevronLeft />
      </button>
      <div className="grid flex-1 grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const k = keyOf(day);
          const off = k > todayKey || k < minKey;
          const score = off ? null : dayScore(habits, logs[k], k);
          const isSel = k === selected;
          const isToday = k === todayKey;
          return (
            <button
              key={k}
              type="button"
              disabled={off}
              aria-pressed={isSel}
              aria-label={`${fmtLong(day)}${score != null ? `, ${Math.round(score * 100)}% of habits` : ""}`}
              onClick={() => onPick(k)}
              className={`grid justify-items-center gap-1 rounded-xl py-1.5 transition-colors ${
                isSel ? "bg-accent-soft" : off ? "opacity-35" : "hover:bg-surface-2"
              }`}
            >
              <span className={`text-[10.5px] font-semibold uppercase ${isToday ? "text-accent" : "text-muted"}`}>
                {day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
              </span>
              <span className="relative grid h-8 w-8 place-items-center">
                <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <circle cx="16" cy="16" r={r} fill="none" stroke="var(--heat-0)" strokeWidth="3" />
                  {score != null && score > 0 && (
                    <circle
                      cx="16"
                      cy="16"
                      r={r}
                      fill="none"
                      stroke={score >= 1 ? "var(--good)" : "var(--heat-3)"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${c * score} ${c}`}
                      transform="rotate(-90 16 16)"
                    />
                  )}
                </svg>
                <span className={`num relative text-[12px] ${isSel ? "font-bold text-ink" : "text-muted"}`}>{day.getDate()}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="icon-btn !h-9 !w-8 flex-none !border-transparent !bg-transparent"
        aria-label="Next week"
        disabled={keyOf(addDays(first, 6)) >= todayKey}
        onClick={() => onPick(nextWeek)}
      >
        <ChevronRight />
      </button>
    </div>
  );
}

const CONFETTI_COLORS = ["var(--accent)", "var(--heat-3)", "var(--good)", "var(--heat-2)", "#f6c34a"];

/** A short burst of confetti when the day's habits are all done. */
function Confetti() {
  return (
    <div className="confetti pointer-events-none absolute inset-x-0 top-40 z-10 h-0" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2;
        const dist = 90 + (i % 5) * 22;
        return (
          <i
            key={i}
            style={
              {
                left: "50%",
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                "--x": `${Math.cos(angle) * dist}px`,
                "--y": `${Math.sin(angle) * dist * 0.7 - 30}px`,
                "--r": `${(i % 2 ? 1 : -1) * (180 + i * 25)}deg`,
                animationDelay: `${(i % 4) * 25}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
