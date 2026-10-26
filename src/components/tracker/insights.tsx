"use client";

import { addDays, daysBetween, fmtLong, fmtShort, keyOf, parseKey } from "@/lib/tracker/dates";
import {
  dayScore,
  habitValue,
  heatLevel,
  lastNDays,
  overview,
  programStart,
  type StreakInfo,
} from "@/lib/tracker/math";
import type { DayLog, Habit, Profile, Relapse } from "@/lib/tracker/types";

function CardHead({ eyebrow, title, id, sub, right }: { eyebrow: string; title: string; id?: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={id} className="text-xl font-bold">
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-[13.5px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export function StatsCard({
  profile,
  relapses,
  logs,
  streak,
  today,
}: {
  profile: Profile;
  relapses: Relapse[];
  logs: Record<string, DayLog>;
  streak: StreakInfo;
  today: Date;
}) {
  const o = overview(profile, relapses, logs, today);
  const goal = profile.goalDays;
  const tiles: [React.ReactNode, string][] = [
    [<>{streak.currentDays}<small>d</small></>, "Current streak"],
    [<>{streak.bestDays}<small>d</small></>, "Best streak"],
    [<>{o.clean}<small>/ {o.span}</small></>, "Clean days in program"],
    [o.resisted, "Urges beaten"],
  ];
  return (
    <section className="card" aria-labelledby="statsTitle">
      <CardHead eyebrow="Overview" title="Your numbers" id="statsTitle" />
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map(([v, l]) => (
          <div key={l} className="grid gap-0.5 rounded-xl border border-line bg-surface-2 p-3.5">
            <b className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] tabular-nums [&_small]:ml-[3px] [&_small]:text-sm [&_small]:font-semibold [&_small]:tracking-normal [&_small]:text-muted">
              {v}
            </b>
            <span className="text-[12.5px] font-medium text-muted">{l}</span>
          </div>
        ))}
      </div>
      <div className="mt-[18px] grid gap-[7px]">
        <div className="flex justify-between gap-3 text-[13.5px] text-muted">
          <span>Program progress</span>
          <span className="num">
            <b className="text-ink">{Math.min(o.span, goal)}</b> / {goal} days
          </span>
        </div>
        <div className="track">
          <i style={{ width: `${Math.min(100, (o.span / goal) * 100).toFixed(1)}%`, background: "var(--heat-3)" }} />
        </div>
        <div className="flex justify-between gap-3 text-[13.5px] text-muted">
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

/* ------------------------------------------------------------------------- */

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
  const goal = profile.goalDays;
  const start = programStart(profile);
  const end = addDays(start, goal - 1);
  const offset = (start.getDay() + 6) % 7; // Monday first
  const gridStart = addDays(start, -offset);
  const weeks = Math.ceil((daysBetween(gridStart, end) + 1) / 7);
  const todayK = keyOf(today);

  const cells: React.ReactNode[] = [];
  const months: React.ReactNode[] = [];
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
      const score = future ? null : dayScore(habits, logs[k]);
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

  return (
    <section id="progress" className="card scroll-mt-20" aria-labelledby="progTitle">
      <CardHead
        eyebrow={`${goal} day map`}
        title={`${fmtShort(start)} to ${fmtShort(end)}`}
        id="progTitle"
        sub="Each square is one day, shaded by how many habits you completed. Click a day to edit it."
        right={
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-muted">
            <span>
              <b className="num text-ink">{logged}</b> days logged
            </span>
            <span>
              <b className="num text-ink">{full}</b> near-perfect days
            </span>
            <span>
              <b className="num text-ink">{resets}</b> resets
            </span>
          </div>
        }
      />
      <div className="overflow-x-auto pb-1.5">
        <div className="heat">
          {(["Mon", "Wed", "Fri"] as const).map((l, i) => (
            <span key={l} className="self-center pr-1 text-[10px] text-faint" style={{ gridRow: 3 + i * 2, gridColumn: 1 }}>
              {l}
            </span>
          ))}
          {months}
          {cells}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
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
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function TrendCard({ logs, today }: { logs: Record<string, DayLog>; today: Date }) {
  const N = 30;
  const W = 320;
  const H = 150;
  const L = 20;
  const R = 6;
  const T = 8;
  const B = 20;
  const days = lastNDays(today, N);
  const x = (i: number) => L + (i / (N - 1)) * (W - L - R);
  const y = (v: number) => T + ((5 - v) / 4) * (H - T - B);

  function series(key: "mood" | "urge") {
    let d = "";
    let pen = false;
    let last: [number, number] | null = null;
    days.forEach((k, i) => {
      const v = logs[k]?.[key];
      if (v) {
        d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
        last = [x(i), y(v)];
      } else pen = false;
    });
    return { d, last: last as [number, number] | null };
  }
  const mood = series("mood");
  const urge = series("urge");
  const has = Boolean(mood.d || urge.d);

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
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label="Mood and urge levels over the last 30 days">
            {[1, 2, 3, 4, 5].map((v) => (
              <g key={v}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                <text x={L - 6} y={y(v) + 3} textAnchor="end" fill="var(--faint)" fontSize="10" fontFamily="var(--font-mono)">
                  {v}
                </text>
              </g>
            ))}
            {[0, 14, 29].map((i) => (
              <text
                key={i}
                x={x(i)}
                y={H - 4}
                textAnchor={i === 0 ? "start" : i === 29 ? "end" : "middle"}
                fill="var(--faint)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {fmtShort(parseKey(days[i]))}
              </text>
            ))}
            <path d={mood.d} fill="none" stroke="var(--heat-3)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d={urge.d} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            {mood.last && <circle cx={mood.last[0]} cy={mood.last[1]} r="4" fill="var(--heat-3)" stroke="var(--surface)" strokeWidth="2" />}
            {urge.last && <circle cx={urge.last[0]} cy={urge.last[1]} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />}
          </svg>
          <p className="mt-2.5 text-[13.5px] text-muted">When urges climb while mood drops, plan your evenings tighter.</p>
        </>
      ) : (
        <div className="empty">Rate your mood and urges in today&apos;s check-in to see the trend here.</div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

function Bars({ rows, warm }: { rows: { label: string; value: string; pct: number }[]; warm?: boolean }) {
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_46px] items-center gap-x-2.5 gap-y-1 text-[13.5px]">
          <span className="truncate" title={r.label}>
            {r.label}
          </span>
          <b className="num text-right text-[12.5px]">{r.value}</b>
          <div className="track col-span-2 !h-[7px]">
            <i style={{ width: `${r.pct}%`, background: warm ? "var(--accent)" : "var(--heat-3)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
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
  const rows = habits.map((h) => {
    const pct = Math.round((keys.reduce((a, k) => a + habitValue(h, logs[k]), 0) / n) * 100);
    return { label: h.name, value: `${pct}%`, pct };
  });
  return (
    <section className="card">
      <CardHead eyebrow={`Last ${n} day${n === 1 ? "" : "s"}`} title="Habit strength" />
      {rows.length ? <Bars rows={rows} /> : <div className="empty">Add habits in Settings to see how consistent you are.</div>}
    </section>
  );
}

export function TriggersCard({ relapses }: { relapses: Relapse[] }) {
  const counts = new Map<string, number>();
  for (const r of relapses) {
    const t = r.trigger || "Not noted";
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  const night = relapses.filter((r) => {
    const h = new Date(r.at).getHours();
    return h >= 22 || h < 4;
  }).length;
  return (
    <section className="card">
      <CardHead eyebrow="From your resets" title="What trips you up" />
      {sorted.length ? (
        <>
          <Bars warm rows={sorted.map(([t, c]) => ({ label: t, value: `${c}×`, pct: Math.round((c / max) * 100) }))} />
          <p className="mt-3 text-[13.5px] text-muted">
            {night
              ? `${night} of ${relapses.length} reset${relapses.length === 1 ? "" : "s"} happened between 10pm and 4am.`
              : "None of your resets happened late at night."}
          </p>
        </>
      ) : (
        <div className="empty">No resets logged. When one happens, note the trigger and patterns will show up here.</div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

const MOOD_WORD = ["", "Low", "Meh", "Okay", "Good", "Great"];

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
      <CardHead
        eyebrow="Journal"
        title="Your notes"
        id="journalTitle"
        sub="Write in today's check-in. Resets you log show up here too."
      />
      {shown.length ? (
        <ul className="grid">
          {shown.map((it) => {
            const d = parseKey(it.k);
            return (
              <li
                key={it.reset ? `r${it.reset.id}` : `d${it.k}`}
                className="grid grid-cols-[64px_1fr] gap-3.5 border-t border-line py-3 first:border-t-0 first:pt-0"
              >
                <time dateTime={it.k} className="num text-xs leading-snug text-muted">
                  <b className="block font-display text-[22px] font-bold text-ink">{d.getDate()}</b>
                  {d.toLocaleDateString(undefined, { month: "short" })}
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
                        {it.log?.mood ? <span className="tag">Mood: {MOOD_WORD[it.log.mood]}</span> : null}
                        {it.log?.urge ? <span className="tag">Urges {it.log.urge}/5</span> : null}
                        <button type="button" className="text-[12.5px] font-semibold text-accent" onClick={() => onOpen(it.k)}>
                          Open day
                        </button>
                      </>
                    )}
                  </div>
                  {(it.reset?.note || it.log?.note) && (
                    <p className="mt-1 max-w-[70ch] whitespace-pre-wrap [overflow-wrap:anywhere]">{it.reset?.note || it.log?.note}</p>
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
