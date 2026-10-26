import { PHASES } from "./constants";
import { DAY_MS, addDays, daysBetween, keyOf, startOfDay } from "./dates";
import type { DayLog, Habit, Profile, Relapse } from "./types";

export type StreakInfo = {
  /** ms timestamp of the moment the current streak started */
  last: number;
  currentMs: number;
  bestMs: number;
  currentDays: number;
  bestDays: number;
};

export function streakInfo(profile: Profile, relapses: Relapse[], now: number): StreakInfo {
  const points = [profile.startAt, ...relapses.map((r) => r.at)]
    .map((s) => new Date(s).getTime())
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const past = points.filter((t) => t <= now);
  const last = past.length ? past[past.length - 1] : points[0] ?? now;
  const currentMs = Math.max(0, now - last);
  let bestMs = currentMs;
  for (let i = 1; i < past.length; i++) bestMs = Math.max(bestMs, past[i] - past[i - 1]);
  return {
    last,
    currentMs,
    bestMs,
    currentDays: Math.floor(currentMs / DAY_MS),
    bestDays: Math.floor(bestMs / DAY_MS),
  };
}

export function milestones(goal: number): number[] {
  const base = [1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 150, 180, 270, 365, 500, 730];
  const list = base.filter((n) => n < goal);
  list.push(goal);
  return list;
}

export function phaseFor(days: number) {
  return PHASES.find((p) => days < p.to) ?? PHASES[PHASES.length - 1];
}

/** 0..1 completion for one habit on one day. */
export function habitValue(h: Habit, log: DayLog | undefined | null): number {
  if (!log) return 0;
  const v = Number(log.habits?.[h.id] ?? 0);
  if (h.kind === "count") return Math.min(1, v / Math.max(1, h.target));
  return v ? 1 : 0;
}

export function isLogged(log: DayLog | undefined | null): boolean {
  if (!log) return false;
  return (
    Object.values(log.habits ?? {}).some((v) => Number(v) > 0) ||
    Boolean(log.mood || log.energy || log.urge || log.note || log.resisted)
  );
}

/** Average habit completion for a day, or null when nothing was logged. */
export function dayScore(habits: Habit[], log: DayLog | undefined | null): number | null {
  if (!habits.length || !isLogged(log)) return null;
  return habits.reduce((a, h) => a + habitValue(h, log), 0) / habits.length;
}

export function heatLevel(score: number | null): 0 | 1 | 2 | 3 | 4 | null {
  if (score == null) return null;
  if (score === 0) return 0;
  if (score <= 0.25) return 1;
  if (score <= 0.5) return 2;
  if (score <= 0.8) return 3;
  return 4;
}

export function relapseDayMap(relapses: Relapse[]): Record<string, Relapse[]> {
  const m: Record<string, Relapse[]> = {};
  for (const r of relapses) {
    const k = keyOf(new Date(r.at));
    (m[k] ??= []).push(r);
  }
  return m;
}

export function programStart(profile: Profile): Date {
  return startOfDay(new Date(profile.startAt));
}

export function overview(profile: Profile, relapses: Relapse[], logs: Record<string, DayLog>, today: Date) {
  const start = programStart(profile);
  const span = Math.max(1, daysBetween(start, today) + 1);
  const startKey = keyOf(start);
  const todayK = keyOf(today);
  const relDays = Object.keys(relapseDayMap(relapses)).filter((k) => k >= startKey && k <= todayK).length;
  let resisted = 0;
  let logged = 0;
  for (const l of Object.values(logs)) {
    resisted += l.resisted || 0;
    if (isLogged(l)) logged++;
  }
  return { span, clean: Math.max(0, span - relDays), resisted, logged };
}

export function lastNDays(today: Date, n: number): string[] {
  return Array.from({ length: n }, (_, i) => keyOf(addDays(today, i - n + 1)));
}

export function emptyLog(date: string): DayLog {
  return { date, mood: null, energy: null, urge: null, resisted: 0, note: null, habits: {} };
}
