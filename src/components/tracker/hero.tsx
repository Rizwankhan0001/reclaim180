"use client";

import { DropIcon, FlagIcon, InfoIcon, LockIcon, ResetIcon, TrophyIcon } from "@/components/icons";
import { PhaseTrack } from "@/components/phase-track";
import { useNow } from "@/lib/hooks";
import { DAY_MS, fmtDuration, fmtShort, pad } from "@/lib/tracker/dates";
import { milestones, phaseFor, type StreakInfo } from "@/lib/tracker/math";
import type { Profile } from "@/lib/tracker/types";

function Ring({ frac, ticks, days }: { frac: number; ticks: { frac: number; got: boolean }[]; days: number }) {
  const r = 108;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac));
  return (
    <div className="relative h-[220px] w-[220px] max-w-full md:h-[260px] md:w-[260px]">
      <svg viewBox="0 0 260 260" className="block h-full w-full" role="img" aria-label={`${Math.round(f * 100)}% of your goal`}>
        <defs>
          <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "color-mix(in oklab, var(--accent) 62%, white)" }} />
            <stop offset="1" style={{ stopColor: "var(--accent)" }} />
          </linearGradient>
        </defs>
        <circle cx="130" cy="130" r={r} fill="none" stroke="rgb(255 255 255 / 0.09)" strokeWidth="16" />
        <circle
          cx="130"
          cy="130"
          r={r}
          fill="none"
          stroke="url(#heroRing)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(c * f).toFixed(1)} ${c.toFixed(1)}`}
          transform="rotate(-90 130 130)"
          style={{ transition: "stroke-dasharray .8s ease", filter: "drop-shadow(0 0 10px var(--glow))" }}
        />
        {ticks.map((t) => {
          const a = ((t.frac * 360 - 90) * Math.PI) / 180;
          return (
            <line
              key={t.frac}
              x1={130 + Math.cos(a) * 123}
              y1={130 + Math.sin(a) * 123}
              x2={130 + Math.cos(a) * 129}
              y2={130 + Math.sin(a) * 129}
              stroke={t.got ? "var(--accent)" : "rgb(255 255 255 / 0.3)"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="font-display text-[64px] leading-[0.9] font-extrabold tracking-[-0.04em] text-night-ink tabular-nums md:text-[80px]">
          {days}
        </div>
        <div className="mt-2 text-[13px] font-medium text-night-muted">{days === 1 ? "day" : "days"} clean</div>
      </div>
    </div>
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
    <div className="grid w-full max-w-[320px] grid-cols-4 gap-1.5 md:w-auto" aria-label="Time since your streak started">
      {segs.map(([v, l]) => (
        <div key={l} className="grid min-w-0 justify-items-start rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2 sm:px-3">
          <b className="num text-[22px] font-semibold text-night-ink">{v}</b>
          <span className="text-[10.5px] tracking-[0.08em] text-night-muted uppercase">{l}</span>
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
  const justReached = streak.currentDays > 0 && ms.includes(streak.currentDays) ? streak.currentDays : null;
  const name = profile.displayName;
  const { mantra, rewards } = profile.preferences;
  const nextReward = rewards[String(next)];
  const reachedReward = justReached ? rewards[String(justReached)] : undefined;

  return (
    <div className="grid gap-7">
      {justReached && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/15 px-4 py-3 text-night-ink">
          <TrophyIcon className="h-6 w-6 flex-none text-accent" />
          <p className="text-[15px]">
            <b>Milestone unlocked: {justReached} {justReached === 1 ? "day" : "days"}.</b>{" "}
            <span className="text-night-muted">
              {reachedReward ? `You earned it: ${reachedReward}.` : "Take a second to notice how far you've come."}
            </span>
          </p>
        </div>
      )}
      <div className="grid items-center justify-items-center gap-7 text-center md:grid-cols-[auto_1fr] md:justify-items-stretch md:gap-12 md:text-left">
        <Ring
          days={streak.currentDays}
          frac={streak.currentMs / (goal * DAY_MS)}
          ticks={ms.filter((m) => m < goal).map((m) => ({ frac: m / goal, got: streak.currentDays >= m }))}
        />

        <div className="grid w-full min-w-0 justify-items-center gap-5 md:justify-items-start">
          <div>
            <h1 className="text-[clamp(28px,3.6vw,42px)] leading-[1.05] font-extrabold tracking-[-0.025em] text-night-ink">
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
            {mantra && (
              <p className="mt-2 font-display text-[17px] font-semibold text-night-ink/90 italic">&ldquo;{mantra}&rdquo;</p>
            )}
            <p className="mt-1.5 text-[14px] text-balance text-night-muted">
              Best streak {streak.bestDays} {streak.bestDays === 1 ? "day" : "days"} · Started {fmtShort(new Date(profile.startAt))} · Goal {goal} days
            </p>
          </div>

          <Clock since={streak.last} />

          <div className="grid w-full max-w-[640px] gap-5 text-left sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <span className="eyebrow">You are here</span>
              <PhaseTrack days={streak.currentDays} onDark compact />
            </div>
            {!done && (
              <div className="grid content-start gap-2">
                <span className="eyebrow">Next milestone</span>
                <div className="flex items-baseline justify-between gap-3 text-[14px] text-night-muted">
                  <b className="text-night-ink">{next} days</b>
                  <span className="num">{fmtDuration(toGo)} to go</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/12">
                  <i className="block h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(frac * 100).toFixed(1)}%` }} />
                </div>
                {nextReward && <span className="text-[12.5px] text-night-muted">Reward: <b className="text-night-ink">{nextReward}</b></span>}
              </div>
            )}
          </div>

          <p className="flex max-w-[64ch] items-start gap-2 text-left text-[14px] text-night-muted">
            <InfoIcon className="mt-0.5 h-4 w-4 flex-none text-accent" />
            <span>
              <b className="text-night-ink">{phase.name}:</b> {phase.tip}
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 md:justify-start">
            <button type="button" className="btn btn-primary btn-glow !px-5" onClick={onSos}>
              <DropIcon /> Urge? Get through it
            </button>
            <button type="button" className="btn !px-5" onClick={onReset}>
              <ResetIcon /> Log a reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Milestones({ goal, streak, rewards = {} }: { goal: number; streak: StreakInfo; rewards?: Record<string, string> }) {
  const ms = milestones(goal);
  const cur = streak.currentMs / DAY_MS;
  const best = streak.bestMs / DAY_MS;
  const nextM = ms.find((m) => m > cur);
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-1" aria-label="Milestones">
      {ms.map((m) => {
        const got = cur >= m;
        const isNext = m === nextM;
        const years = m >= 365 && m % 365 === 0;
        const shown = years ? m / 365 : m;
        const unit = m === 1 ? "day" : years ? (m === 365 ? "year" : "years") : "days";
        const cls = got
          ? "border-transparent bg-accent/20 text-night-ink"
          : isNext
            ? "border-accent text-night-ink"
            : "border-dashed border-white/15 text-night-muted";
        return (
          <div
            key={m}
            className={`grid min-w-[62px] flex-none justify-items-center gap-[3px] rounded-xl border px-2 pt-2.5 pb-2 ${cls}`}
            title={`${got ? "Reached in this streak" : best >= m ? "Reached in a past streak" : "Not reached yet"}${rewards[String(m)] ? ` · Reward: ${rewards[String(m)]}` : ""}`}
          >
            {got || isNext ? <FlagIcon className={`h-5 w-5 ${got ? "text-accent" : ""}`} /> : <LockIcon className="h-5 w-5 opacity-70" />}
            <b className="num text-[13px]">{shown}</b>
            <span className="text-[10px] tracking-[0.06em] uppercase opacity-80">{unit}</span>
            {rewards[String(m)] && <i className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" aria-label="Has a reward" />}
          </div>
        );
      })}
    </div>
  );
}
