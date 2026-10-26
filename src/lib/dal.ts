import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { dayLog, habit, profile, relapse } from "@/db/schema";
import { auth } from "./auth";
import type { DayLog, Habit, TrackerData } from "./tracker/types";

/** The current session, read once per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Use in pages: sends signed-out visitors to the sign-in page. */
export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/sign-in");
  return s.user;
}

/** Use in server actions and route handlers. */
export async function requireUserId(): Promise<string> {
  const s = await getSession();
  if (!s) throw new Error("You're signed out. Sign in again to save.");
  return s.user.id;
}

export async function hasProfile(userId: string): Promise<boolean> {
  const rows = await db.select({ id: profile.userId }).from(profile).where(eq(profile.userId, userId)).limit(1);
  return rows.length > 0;
}

export function toHabit(row: typeof habit.$inferSelect): Habit {
  return { id: row.id, name: row.name, kind: row.kind, target: row.target, unit: row.unit, position: row.position };
}

export function toDayLog(row: typeof dayLog.$inferSelect): DayLog {
  return {
    date: row.date,
    mood: row.mood,
    energy: row.energy,
    urge: row.urge,
    resisted: row.resisted,
    note: row.note,
    habits: row.habits ?? {},
  };
}

/** Everything the dashboard needs, fetched in parallel. */
export async function loadTracker(userId: string): Promise<TrackerData | null> {
  const [profiles, habits, logs, relapses] = await Promise.all([
    db.select().from(profile).where(eq(profile.userId, userId)).limit(1),
    db
      .select()
      .from(habit)
      .where(and(eq(habit.userId, userId), isNull(habit.archivedAt)))
      .orderBy(asc(habit.position), asc(habit.createdAt)),
    db.select().from(dayLog).where(eq(dayLog.userId, userId)),
    db.select().from(relapse).where(eq(relapse.userId, userId)).orderBy(asc(relapse.at)),
  ]);
  const p = profiles[0];
  if (!p) return null;
  return {
    profile: {
      displayName: p.displayName,
      startAt: p.startAt.toISOString(),
      goalDays: p.goalDays,
      reasons: p.reasons ?? [],
    },
    habits: habits.map(toHabit),
    logs: Object.fromEntries(logs.map((l) => [l.date, toDayLog(l)])),
    relapses: relapses.map((r) => ({ id: r.id, at: r.at.toISOString(), trigger: r.trigger, note: r.note })),
  };
}
