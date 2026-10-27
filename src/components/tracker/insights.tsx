"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BoltIcon, CircleCheckIcon, FlameIcon, InfoIcon, TrophyIcon } from "@/components/icons";
import { SCALE_WORDS, TRIGGER_TIPS } from "@/lib/tracker/constants";
import { addDays, daysBetween, fmtLong, fmtShort, keyOf, parseKey } from "@/lib/tracker/dates";
import {
  dayScore,
  habitValue,
  heatLevel,
  isScheduled,
  lastNDays,
  overview,
  programStart,
  type StreakInfo,
} from "@/lib/tracker/math";
import type { DayLog, Habit, Profile, Relapse } from "@/lib/tracker/types";

function CardHead({ eyebrow, title, id, sub, right }: { eyebrow: string; title: string; id?: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={id} className="mt-0.5 text-[20px] font-bold">
          {title}
        </h2>
        {sub && <p className="mt-1 max-w-[62ch] text-[13.5px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* --------------------------------------------------------------- overview */

export function StatsCard({
  profile,
  relapses,
  logs,
  habits,
  streak,
  today,
  showWeek = true,
}: {
  profile: Profile;
  relapses: Relapse[];
  logs: Record<string, DayLog>;
  habits: Habit[];
  streak: StreakInfo;
  today: Date;
  showWeek?: boolean;
}) {
  const o = overview(profile, relapses, logs, today);
  const goal = profile.goalDays;
  const tiles: { icon: ReactNode; value: ReactNode; label: string; hint: string }[] = [
    { icon: <FlameIcon className="h-5 w-5 text-accent" />, value: <>{streak.currentDays}<small>days</small></>, label: "Current streak", hint: "Time since your last reset" },
    { icon: <TrophyIcon className="h-5 w-5 text-accent" />, value: <>{streak.bestDays}<small>days</small></>, label: "Best streak", hint: "Your longest run so far" },
    { icon: <CircleCheckIcon className="h-5 w-5 text-heat-3" />, value: <>{o.clean}<small>of {o.span}</small></>, label: "Clean days", hint: "Days in the program without a reset" },
    { icon: <BoltIcon className="h-5 w-5 text-heat-3" />, value: o.resisted, label: "Urges beaten", hint: "Urges you got through" },
  ];

  // This week: habit completion for the last 7 days
  const week = lastNDays(today, 7).map((k) => ({ k, score: dayScore(habits, logs[k], k) }));
  const logged = week.filter((w) => w.score != null);
  const avg = logged.length ? Math.round((logged.reduce((a, w) => a + (w.score ?? 0), 0) / logged.length) * 100) : null;
  const todayK = keyOf(today);

  return (
    <section className="card" aria-labelledby="statsTitle">
      <CardHead eyebrow="Overview" title="Your numbers" id="statsTitle" />
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="grid gap-1 rounded-2xl border border-line bg-surface-2 p-3.5" title={t.hint}>
            {t.icon}
            <b className="mt-1 font-display text-[30px] leading-none font-extrabold tracking-[-0.03em] tabular-nums [&_small]:ml-1 [&_small]:text-[13px] [&_small]:font-semibold [&_small]:tracking-normal [&_small]:text-muted">
              {t.value}
            </b>
            <span className="text-[12.5px] font-medium text-muted">{t.label}</span>
          </div>
        ))}
      </div>

      {showWeek && (
      <div className="mt-5 rounded-2xl border border-line p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] font-bold">This week</span>
          <span className="text-[12.5px] text-muted">{avg == null ? "No check-ins yet" : `${avg}% of habits on average`}</span>
        </div>
        <div className="mt-3 grid h-[92px] grid-cols-7 items-end gap-2">
          {week.map((w) => {
            const d = parseKey(w.k);
            const h = w.score == null ? 0 : Math.max(0.06, w.score);
            return (
              <div key={w.k} className="grid h-full grid-rows-[1fr_auto] gap-1.5 text-center" title={`${fmtLong(d)}${w.score == null ? " · not logged" : ` · ${Math.round(w.score * 100)}%`}`}>
                <div className="relative flex items-end overflow-hidden rounded-md bg-surface-2">
                  {w.score == null ? (
                    <span className="absolute inset-x-1 bottom-1 border-t border-dashed border-faint/60" />
                  ) : (
                    <span
                      className="block w-full rounded-md"
                      style={{ height: `${h * 100}%`, background: w.score >= 0.8 ? "var(--heat-4)" : "var(--heat-3)" }}
                    />
                  )}
                </div>
                <span className={`text-[11px] ${w.k === todayK ? "font-bold text-accent" : "text-muted"}`}>
                  {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      <div className="mt-5 grid gap-2">
        <div className="flex justify-between gap-3 text-[13.5px]">
          <span className="font-semibold">Program progress</span>
          <span className="num text-muted">
            <b className="text-ink">{Math.min(o.span, goal)}</b> / {goal} days
          </span>
        </div>
        <div className="track">
          <i style={{ width: `${Math.min(100, (o.span / goal) * 100).toFixed(1)}%`, background: "var(--heat-3)" }} />
        </div>
        <div className="flex justify-between gap-3 text-[12.5px] text-muted">
          <span>
            {relapses.length} reset{relapses.length === 1 ? "" : "s"} logged
          </span>
          <span>
            {o.logged} day{o.logged === 1 ? "" : "s"} checked in
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- heatmap */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HeatmapCard({
  profile,
  habits,
  logs,
  resetDays,
  today,
  selected,
  onPick,
}: {
  profile: Profile;
  habits: Habit[];
  logs: Record<string, DayLog>;
  resetDays: Record<string, Relapse[]>;
  today: Date;
  selected: string;
  onPick: (k: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  // On narrow screens the map scrolls sideways: bring today into view.
  useEffect(() => {
    const box = scroller.current;
    const cell = box?.querySelector<HTMLElement>("[data-today=true]");
    if (box && cell && box.scrollWidth > box.clientWidth) {
      box.scrollLeft = Math.max(0, cell.offsetLeft - box.clientWidth * 0.6);
    }
  }, []);
  const goal = profile.goalDays;
  const start = programStart(profile);
  const end = addDays(start, goal - 1);
  const weekStart = profile.preferences.weekStart;
  const offset = (start.getDay() - weekStart + 7) % 7;
  const gridStart = addDays(start, -offset);
  const weeks = Math.ceil((daysBetween(gridStart, end) + 1) / 7);
  const todayK = keyOf(today);

  const cells: ReactNode[] = [];
  const months: ReactNode[] = [];
  let lastMonth = -1;
  let logged = 0;
  let full = 0;
  let resets = 0;

  for (let w = 0; w < weeks; w++) {
    for (let r = 0; r < 7; r++) {
      const d = addDays(gridStart, w * 7 + r);
      if (d < start || d > end) continue;
      const k = keyOf(d);
      if (d.getMonth() !== lastMonth && (r === 0 || k === keyOf(start))) {
        lastMonth = d.getMonth();
        months.push(
          <span key={`m${k}`} className="text-[11px] font-semibold whitespace-nowrap text-muted" style={{ gridRow: 1, gridColumn: w + 2 }}>
            {d.toLocaleDateString(undefined, { month: "short" })}
          </span>,
        );
      }
      const future = k > todayK;
      const score = future ? null : dayScore(habits, logs[k], k);
      const lvl = heatLevel(score);
      if (lvl != null) {
        logged++;
        if (lvl >= 4) full++;
      }
      if (resetDays[k]) resets++;
      const title = `${fmtLong(d)}${future ? "" : score != null ? ` · ${Math.round(score * 100)}% of habits` : " · not logged"}${resetDays[k] ? " · reset" : ""}`;
      cells.push(
        <button
          key={k}
          type="button"
          className="cell"
          style={{ gridRow: r + 2, gridColumn: w + 2 }}
          data-l={lvl ?? undefined}
          data-reset={resetDays[k] ? "true" : undefined}
          data-today={k === todayK ? "true" : undefined}
          data-sel={k === selected && k !== todayK ? "true" : undefined}
          disabled={future}
          title={title}
          aria-label={title}
          onClick={() => onPick(k)}
        />,
      );
    }
  }

  const stats: [number, string][] = [
    [logged, "days logged"],
    [full, "near-perfect days"],
    [resets, resets === 1 ? "reset" : "resets"],
  ];

  return (
    <section id="progress" className="card scroll-mt-20" aria-labelledby="progTitle">
      <CardHead
        eyebrow={`Your ${goal}-day map`}
        title={`${fmtShort(start)} to ${fmtShort(end)}`}
        id="progTitle"
        sub="Each square is one day. The darker it is, the more habits you did. Tap a day to open it."
        right={
          <div className="flex flex-wrap gap-2">
            {stats.map(([n, l]) => (
              <span key={l} className="rounded-xl bg-surface-2 px-3 py-1.5 text-[13px] text-muted">
                <b className="num text-ink">{n}</b> {l}
              </span>
            ))}
          </div>
        }
      />
      <div ref={scroller} className="heat-wrap overflow-x-auto pb-1.5" style={{ ["--weeks" as string]: weeks }}>
        <div className="heat">
          {[0, 2, 4, 6].map((r) => (
            <span key={r} className="self-center pr-1 text-[10px] text-faint" style={{ gridRow: r + 2, gridColumn: 1 }}>
              {WEEKDAYS[(weekStart + r) % 7]}
            </span>
          ))}
          {months}
          {cells}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-[3px]">
          Fewer habits
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} className="inline-block h-[11px] w-[11px] rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
          ))}
          More
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-bad" /> Reset
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-[11px] w-[11px] rounded-[3px] outline-2 outline-accent" /> Today
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-[11px] w-[11px] rounded-[3px] border border-dashed border-line" /> Still to come
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ trend */

/** 7-day rolling average, so one rough day doesn't hide the direction. */
function rolling(values: (number | null)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null);
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
  });
}

/** Smooth curve through points (Catmull-Rom to Bézier); breaks at gaps. */
function smoothPath(points: ([number, number] | null)[]): string {
  let d = "";
  const runs: [number, number][][] = [];
  let cur: [number, number][] = [];
  for (const p of points) {
    if (p) cur.push(p);
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  for (const run of runs) {
    d += `M${run[0][0].toFixed(1)},${run[0][1].toFixed(1)}`;
    for (let i = 0; i < run.length - 1; i++) {
      const p0 = run[i - 1] ?? run[i];
      const p1 = run[i];
      const p2 = run[i + 1];
      const p3 = run[i + 2] ?? p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
  }
  return d;
}

function avgOf(keys: string[], logs: Record<string, DayLog>, key: "mood" | "urge") {
  const v = keys.map((k) => logs[k]?.[key]).filter((x): x is number => typeof x === "number" && x > 0);
  return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function trendSentence(logs: Record<string, DayLog>, today: Date): string {
  const thisWeek = lastNDays(today, 7);
  const lastWeek = lastNDays(addDays(today, -7), 7);
  const parts: string[] = [];
  const u1 = avgOf(thisWeek, logs, "urge");
  const u0 = avgOf(lastWeek, logs, "urge");
  const m1 = avgOf(thisWeek, logs, "mood");
  const m0 = avgOf(lastWeek, logs, "mood");
  if (u1 != null && u0 != null) {
    const d = u1 - u0;
    parts.push(Math.abs(d) < 0.3 ? "Urges are about the same as last week" : d < 0 ? "Urges are lower than last week" : "Urges are higher than last week");
  }
  if (m1 != null && m0 != null) {
    const d = m1 - m0;
    parts.push(Math.abs(d) < 0.3 ? "mood is steady" : d > 0 ? "mood is up" : "mood is down");
  }
  if (!parts.length) return "Keep rating your mood and urges. After two weeks you'll see how they're moving.";
  const s = parts.join(", and ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

export function TrendCard({ logs, today }: { logs: Record<string, DayLog>; today: Date }) {
  const N = 30;
  const W = 320;
  const H = 160;
  const L = 50;
  const R = 8;
  const T = 10;
  const B = 22;
  const days = lastNDays(today, N);
  const x = (i: number) => L + (i / (N - 1)) * (W - L - R);
  const y = (v: number) => T + ((5 - v) / 4) * (H - T - B);

  const series = (key: "mood" | "urge") => {
    const raw = days.map((k) => logs[k]?.[key] ?? null);
    const avg = rolling(raw);
    const pts = avg.map((v, i) => (v == null ? null : ([x(i), y(v)] as [number, number])));
    const dots = raw.map((v, i) => (v == null ? null : ([x(i), y(v)] as [number, number]))).filter(Boolean) as [number, number][];
    const lastPt = [...pts].reverse().find(Boolean) ?? null;
    return { path: smoothPath(pts), dots, last: lastPt, pts };
  };
  const mood = series("mood");
  const urge = series("urge");
  const has = Boolean(mood.path || urge.path);

  const firstMood = mood.pts.findIndex(Boolean);
  const lastMoodIdx = mood.pts.length - 1 - [...mood.pts].reverse().findIndex(Boolean);
  const area =
    mood.path && firstMood >= 0 && mood.pts.slice(firstMood, lastMoodIdx + 1).every(Boolean)
      ? `${mood.path}L${x(lastMoodIdx).toFixed(1)},${(H - B).toFixed(1)}L${x(firstMood).toFixed(1)},${(H - B).toFixed(1)}Z`
      : null;

  return (
    <section className="card">
      <CardHead
        eyebrow="Last 30 days"
        title="Mood vs. urges"
        right={
          <div className="flex gap-3.5 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-[3px] w-3.5 rounded-sm bg-heat-3" />
              Mood
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-[3px] w-3.5 rounded-sm bg-accent" />
              Urges
            </span>
          </div>
        }
      />
      {has ? (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label="7-day average of mood and urges over the last 30 days">
            <defs>
              <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--heat-3)" stopOpacity="0.28" />
                <stop offset="1" stopColor="var(--heat-3)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[1, 3, 5].map((v) => (
              <g key={v}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={v === 3 ? "3 4" : undefined} />
                <text x={L - 6} y={y(v) + 3} textAnchor="end" fill="var(--faint)" fontSize="9.5">
                  {v === 5 ? "High" : v === 3 ? "Middle" : "Low"}
                </text>
              </g>
            ))}
            {[0, 15, 29].map((i) => (
              <text key={i} x={x(i)} y={H - 5} textAnchor={i === 0 ? "start" : i === 29 ? "end" : "middle"} fill="var(--faint)" fontSize="9.5" fontFamily="var(--font-mono)">
                {fmtShort(parseKey(days[i]))}
              </text>
            ))}
            {area && <path d={area} fill="url(#moodFill)" />}
            {mood.dots.map(([cx, cy], i) => (
              <circle key={`m${i}`} cx={cx} cy={cy} r="1.6" fill="var(--heat-3)" opacity="0.35" />
            ))}
            {urge.dots.map(([cx, cy], i) => (
              <circle key={`u${i}`} cx={cx} cy={cy} r="1.6" fill="var(--accent)" opacity="0.35" />
            ))}
            <path d={mood.path} fill="none" stroke="var(--heat-3)" strokeWidth="2.6" strokeLinecap="round" />
            <path d={urge.path} fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
            {mood.last && <circle cx={mood.last[0]} cy={mood.last[1]} r="4.5" fill="var(--heat-3)" stroke="var(--surface)" strokeWidth="2" />}
            {urge.last && <circle cx={urge.last[0]} cy={urge.last[1]} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />}
          </svg>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-[13.5px]">
            <InfoIcon className="mt-0.5 h-4 w-4 flex-none text-heat-3" />
            {trendSentence(logs, today)}
          </p>
          <p className="mt-2 text-[11.5px] text-faint">Lines show a 7-day average. Dots are single days.</p>
        </>
      ) : (
        <div className="empty">Rate your mood and urges in your daily check-in to see the trend here.</div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- habits */

function strengthOf(pct: number) {
  if (pct >= 80) return { label: "Strong", color: "var(--good)", cls: "bg-good/12 text-good" };
  if (pct >= 50) return { label: "Building", color: "var(--heat-3)", cls: "bg-heat-3/12 text-heat-3" };
  return { label: "Needs focus", color: "var(--accent)", cls: "bg-accent/12 text-accent" };
}

export function HabitRatesCard({
  profile,
  habits,
  logs,
  today,
}: {
  profile: Profile;
  habits: Habit[];
  logs: Record<string, DayLog>;
  today: Date;
}) {
  const n = Math.max(1, Math.min(30, daysBetween(programStart(profile), today) + 1));
  const keys = lastNDays(today, n);
  const rows = habits
    .map((h) => {
      const due = keys.filter((k) => isScheduled(h, k));
      const pct = due.length ? Math.round((due.reduce((a, k) => a + habitValue(h, logs[k]), 0) / due.length) * 100) : 0;
      return { h, pct };
    })
    .sort((a, b) => b.pct - a.pct);
  return (
    <section className="card">
      <CardHead eyebrow={`Last ${n} day${n === 1 ? "" : "s"}`} title="Habit strength" />
      {rows.length ? (
        <ul className="grid gap-3">
          {rows.map(({ h, pct }) => {
            const s = strengthOf(pct);
            return (
              <li key={h.id} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2 text-[13.5px]">
                  <span className="truncate font-medium" title={h.name}>
                    {h.name}
                  </span>
                  <span className="flex flex-none items-center gap-2">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${s.cls}`}>{s.label}</span>
                    <b className="num w-9 text-right text-[12.5px]">{pct}%</b>
                  </span>
                </div>
                <div className="track !h-[7px]">
                  <i style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty">Add habits in Settings to see how consistent you are.</div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- triggers */

export function TriggersCard({ relapses }: { relapses: Relapse[] }) {
  const counts = new Map<string, number>();
  for (const r of relapses) {
    const t = r.trigger || "Not noted";
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  const top = sorted[0]?.[0];
  const night = relapses.filter((r) => {
    const h = new Date(r.at).getHours();
    return h >= 22 || h < 4;
  }).length;
  return (
    <section className="card">
      <CardHead eyebrow="From your resets" title="What trips you up" />
      {sorted.length ? (
        <div className="grid gap-4">
          <ul className="grid gap-2.5">
            {sorted.map(([t, c]) => (
              <li key={t} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-[13.5px]">
                <span className="truncate font-medium">{t}</span>
                <b className="num text-[12.5px]">{c}×</b>
                <div className="track col-span-2 !h-[7px]">
                  <i style={{ width: `${Math.round((c / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-muted">
            {night
              ? `${night} of ${relapses.length} reset${relapses.length === 1 ? "" : "s"} happened between 10pm and 4am.`
              : "None of your resets happened late at night."}
          </p>
          {top && TRIGGER_TIPS[top] && (
            <p className="rounded-xl bg-accent-soft p-3 text-[13.5px]">
              <b>Tip for {top.toLowerCase()}:</b> {TRIGGER_TIPS[top]}
            </p>
          )}
        </div>
      ) : (
        <div className="empty">No resets logged. If one happens, note what set it off and patterns will show up here.</div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- journal */

const MOOD_COLORS = ["", "var(--bad)", "var(--accent)", "var(--faint)", "var(--heat-3)", "var(--good)"];

export function JournalCard({
  logs,
  relapses,
  onOpen,
}: {
  logs: Record<string, DayLog>;
  relapses: Relapse[];
  onOpen: (k: string) => void;
}) {
  type Item = { k: string; log?: DayLog; reset?: Relapse };
  const items: Item[] = [
    ...Object.values(logs)
      .filter((l) => l.note)
      .map((l): Item => ({ k: l.date, log: l })),
    ...relapses.map((r): Item => ({ k: keyOf(new Date(r.at)), reset: r })),
  ];
  items.sort((a, b) => (a.k < b.k ? 1 : a.k > b.k ? -1 : a.reset ? -1 : 1));
  const shown = items.slice(0, 30);

  return (
    <section id="journal" className="card scroll-mt-20" aria-labelledby="journalTitle">
      <CardHead eyebrow="Journal" title="Your notes" id="journalTitle" sub="Notes from your daily check-ins, with resets marked in red." />
      {shown.length ? (
        <ul className="grid gap-2">
          {shown.map((it) => {
            const d = parseKey(it.k);
            const mood = it.log?.mood ?? 0;
            return (
              <li
                key={it.reset ? `r${it.reset.id}` : `d${it.k}`}
                className={`grid grid-cols-[56px_1fr] gap-4 rounded-2xl border p-3.5 ${it.reset ? "border-bad/25 bg-bad/[0.04]" : "border-line"}`}
              >
                <time dateTime={it.k} className="grid h-fit justify-items-center rounded-xl bg-surface-2 py-1.5 text-center">
                  <b className="font-display text-[22px] leading-none font-bold">{d.getDate()}</b>
                  <span className="num text-[11px] text-muted">{d.toLocaleDateString(undefined, { month: "short" })}</span>
                </time>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {it.reset ? (
                      <>
                        <span className="tag tag-bad">Reset</span>
                        {it.reset.trigger && <span className="tag">{it.reset.trigger}</span>}
                      </>
                    ) : (
                      <>
                        {mood > 0 && (
                          <span className="tag inline-flex items-center gap-1.5">
                            <i className="h-2 w-2 rounded-full" style={{ background: MOOD_COLORS[mood] }} />
                            Mood: {SCALE_WORDS.mood[mood - 1]}
                          </span>
                        )}
                        {it.log?.urge ? <span className="tag">Urges: {SCALE_WORDS.urge[it.log.urge - 1]}</span> : null}
                        <button type="button" className="-my-1.5 ml-auto rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-accent hover:bg-accent-soft" onClick={() => onOpen(it.k)}>
                          Open day
                        </button>
                      </>
                    )}
                  </div>
                  {(it.reset?.note || it.log?.note) && (
                    <p className="mt-1.5 max-w-[70ch] text-[14.5px] whitespace-pre-wrap [overflow-wrap:anywhere]">{it.reset?.note || it.log?.note}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty">No notes yet. A line a day adds up to a clear record of what works for you.</div>
      )}
    </section>
  );
}
