"use client";

import { DropIcon, FlagIcon, LockIcon, ResetIcon } from "@/components/icons";
import { useNow } from "@/lib/hooks";
import { DAY_MS, fmtDuration, fmtShort, pad } from "@/lib/tracker/dates";
import { milestones, phaseFor, type StreakInfo } from "@/lib/tracker/math";
import type { Profile } from "@/lib/tracker/types";

function Ring({ frac, ticks }: { frac: number; ticks: { frac: number; got: boolean }[] }) {
  const r = 108;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac));
  return (
    <svg viewBox="0 0 260 260" className="block h-full w-full" role="img" aria-label={`${Math.round(f * 100)}% of goal`}>
      <circle cx="130" cy="130" r={r} fill="none" stroke="var(--heat-0)" strokeWidth="14" />
      <circle
        cx="130"
        cy="130"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${(c * f).toFixed(1)} ${c.toFixed(1)}`}
        transform="rotate(-90 130 130)"
        style={{ transition: "stroke-dasharray .8s ease" }}
      />
      {ticks.map((t) => {
        const a = ((t.frac * 360 - 90) * Math.PI) / 180;
        return (
          <line
            key={t.frac}
            x1={130 + Math.cos(a) * 122}
            y1={130 + Math.sin(a) * 122}
            x2={130 + Math.cos(a) * 128}
            y2={130 + Math.sin(a) * 128}
            stroke={t.got ? "var(--accent)" : "var(--faint)"}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/** Ticks every second without re-rendering the rest of the dashboard. */
function Clock({ since }: { since: number }) {
  const now = useNow(1000);
  const ms = Math.max(0, now - since);
  const rem = ms % DAY_MS;
  const segs: [string, string][] = [
    [String(Math.floor(ms / DAY_MS)), "days"],
    [pad(Math.floor(rem / 3_600_000)), "hours"],
    [pad(Math.floor((rem % 3_600_000) / 60_000)), "min"],
    [pad(Math.floor((rem % 60_000) / 1000)), "sec"],
  ];
  return (
    <div className="flex flex-wrap justify-center gap-1.5 md:justify-start" aria-label="Current streak">
      {segs.map(([v, l]) => (
        <div key={l} className="grid min-w-[70px] justify-items-start rounded-[10px] border border-line bg-surface px-3 py-2">
          <b className="num text-[22px] font-semibold">{v}</b>
          <span className="text-[11px] tracking-[0.08em] text-muted uppercase">{l}</span>
        </div>
      ))}
    </div>
  );
}

export function Hero({
  profile,
  streak,
  onSos,
  onReset,
}: {
  profile: Profile;
  streak: StreakInfo;
  onSos: () => void;
  onReset: () => void;
}) {
  const goal = profile.goalDays;
  const ms = milestones(goal);
  const curDays = streak.currentMs / DAY_MS;
  const phase = phaseFor(streak.currentDays);
  const next = ms.find((m) => m > curDays) ?? goal;
  const prevIdx = ms.indexOf(next) - 1;
  const prev = prevIdx >= 0 ? ms[prevIdx] : 0;
  const frac = Math.min(1, (curDays - prev) / (next - prev));
  const toGo = Math.max(0, next * DAY_MS - streak.currentMs);
  const done = streak.currentDays >= goal;
  const name = profile.displayName;

  return (
    <div className="grid items-center justify-items-center gap-6 text-center md:grid-cols-[auto_1fr] md:justify-items-stretch md:gap-9 md:text-left">
      <div className="relative h-[230px] w-[230px] max-w-full md:h-[260px] md:w-[260px]">
        <Ring frac={streak.currentMs / (goal * DAY_MS)} ticks={ms.filter((m) => m < goal).map((m) => ({ frac: m / goal, got: streak.currentDays >= m }))} />
        <div className="absolute inset-0 grid place-content-center text-center">
          <div className="font-display text-[64px] leading-[0.9] font-extrabold tracking-[-0.04em] tabular-nums md:text-[76px]">
            {streak.currentDays}
          </div>
          <div className="mt-1.5 text-[13px] font-medium text-muted">{streak.currentDays === 1 ? "day" : "days"} clean</div>
          <div className="num text-xs text-faint">of {goal}</div>
        </div>
      </div>

      <div className="grid min-w-0 justify-items-center gap-[18px] md:justify-items-start">
        <h1 className="text-[clamp(26px,3.4vw,38px)] leading-[1.08] font-bold">
          {done ? (
            <>
              Goal reached. <span className="text-accent">{streak.currentDays} days.</span>
            </>
          ) : (
            <>
              {name ? `${name}, you're on` : "You're on"} <span className="text-accent">day {streak.currentDays + 1}.</span>
            </>
          )}
        </h1>
        <Clock since={streak.last} />
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          <span className="chip !border-transparent !bg-accent-soft">
            <i className="h-2 w-2 rotate-45 rounded-[2px] bg-accent" />
            {phase.name} phase
          </span>
          <span className="chip">
            Best: <span className="num">{streak.bestDays}d</span>
          </span>
          <span className="chip">Started {fmtShort(new Date(profile.startAt))}</span>
        </div>
        {!done && (
          <div className="grid w-full max-w-[520px] gap-[7px]">
            <div className="flex justify-between gap-3 text-[13.5px] text-muted">
              <span>
                Next milestone: <b className="font-semibold text-ink">{next} days</b>
              </span>
              <span className="num">{fmtDuration(toGo)} to go</span>
            </div>
            <div className="track">
              <i style={{ width: `${(frac * 100).toFixed(1)}%` }} />
            </div>
          </div>
        )}
        <p className="max-w-[60ch] text-sm text-muted">{phase.tip}</p>
        <div className="flex flex-wrap justify-center gap-2.5 md:justify-start">
          <button type="button" className="btn btn-primary" onClick={onSos}>
            <DropIcon /> Urge? Get through it
          </button>
          <button type="button" className="btn" onClick={onReset}>
            <ResetIcon /> Log a reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function Milestones({ goal, streak }: { goal: number; streak: StreakInfo }) {
  const ms = milestones(goal);
  const cur = streak.currentMs / DAY_MS;
  const best = streak.bestMs / DAY_MS;
  const nextM = ms.find((m) => m > cur);
  return (
    <div className="flex gap-2 overflow-x-auto pt-[18px] pb-1" aria-label="Milestones">
      {ms.map((m) => {
        const got = cur >= m;
        const isNext = m === nextM;
        const years = m >= 365 && m % 365 === 0;
        const shown = years ? m / 365 : m;
        const unit = m === 1 ? "day" : years ? (m === 365 ? "year" : "years") : "days";
        const cls = got
          ? "border-transparent bg-accent-soft text-ink"
          : isNext
            ? "border-accent text-ink"
            : "border-dashed border-line text-faint";
        return (
          <div
            key={m}
            className={`grid min-w-16 flex-none justify-items-center gap-[3px] rounded-xl border px-2 pt-2.5 pb-2 ${cls}`}
            title={got ? "Reached in this streak" : best >= m ? "Reached in a past streak" : "Not reached yet"}
          >
            {got || isNext ? (
              <FlagIcon className={`h-[22px] w-[22px] ${got ? "text-accent" : ""}`} />
            ) : (
              <LockIcon className="h-[22px] w-[22px]" />
            )}
            <b className="num text-[13px]">{shown}</b>
            <span className="text-[10.5px] tracking-[0.06em] uppercase">{unit}</span>
          </div>
        );
      })}
    </div>
  );
}
