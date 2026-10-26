"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dayLog, habit, profile, relapse } from "@/db/schema";
import { hasProfile, requireUserId, toHabit } from "@/lib/dal";
import type { Habit, Relapse } from "@/lib/tracker/types";
import {
  appBackupSchema,
  createProfileSchema,
  dayLogSchema,
  legacyBackupSchema,
  relapseInputSchema,
  saveSettingsSchema,
} from "@/lib/validation";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

/** An error whose message is safe to show the user. */
class UserError extends Error {}

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Some of that input isn't valid." };
    if (e instanceof UserError) return { ok: false, error: e.message };
    if (e instanceof Error && e.message.startsWith("You're signed out")) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong saving that. Try again." };
  }
}

function habitRows(userId: string, drafts: z.infer<typeof createProfileSchema>["habits"]) {
  return drafts.map((h, i) => ({
    id: crypto.randomUUID(),
    userId,
    name: h.name,
    kind: h.kind,
    target: h.kind === "count" ? h.target : 1,
    unit: h.kind === "count" ? h.unit || "per day" : null,
    position: i,
  }));
}

function assertNotFuture(iso: string, what: string) {
  if (new Date(iso).getTime() > Date.now() + 60_000) throw new UserError(`${what} can't be in the future.`);
}

/* ------------------------------------------------------------------------- */

export async function createProfile(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    const data = createProfileSchema.parse(input);
    assertNotFuture(data.startAt, "The start");
    if (await hasProfile(userId)) throw new UserError("Your tracker is already set up.");
    const rows = habitRows(userId, data.habits);
    await db.transaction(async (tx) => {
      await tx.insert(profile).values({
        userId,
        displayName: data.displayName,
        startAt: new Date(data.startAt),
        goalDays: data.goalDays,
        reasons: data.reasons,
      });
      if (rows.length) await tx.insert(habit).values(rows);
    });
    return null;
  });
}

export async function saveDay(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    const d = dayLogSchema.parse(input);
    const values = {
      mood: d.mood,
      energy: d.energy,
      urge: d.urge,
      resisted: d.resisted,
      note: d.note?.trim() ? d.note : null,
      habits: d.habits,
    };
    await db
      .insert(dayLog)
      .values({ userId, date: d.date, ...values })
      .onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
    return null;
  });
}

export async function logRelapse(input: unknown): Promise<ActionResult<Relapse>> {
  return run(async () => {
    const userId = await requireUserId();
    const r = relapseInputSchema.parse(input);
    assertNotFuture(r.at, "A reset");
    const [p] = await db.select({ startAt: profile.startAt }).from(profile).where(eq(profile.userId, userId)).limit(1);
    if (!p) throw new UserError("Set up your tracker first.");
    const at = new Date(r.at);
    if (at < p.startAt) throw new UserError("That's before your program started.");
    // MySQL has no INSERT ... RETURNING, so the id is created here.
    const row = { id: crypto.randomUUID(), userId, at, trigger: r.trigger, note: r.note?.trim() || null };
    await db.insert(relapse).values(row);
    return { id: row.id, at: at.toISOString(), trigger: row.trigger, note: row.note };
  });
}

export async function deleteRelapse(id: unknown): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    const rid = z.uuid().parse(id);
    await db.delete(relapse).where(and(eq(relapse.id, rid), eq(relapse.userId, userId)));
    return null;
  });
}

export async function saveSettings(input: unknown): Promise<ActionResult<Habit[]>> {
  return run(async () => {
    const userId = await requireUserId();
    const data = saveSettingsSchema.parse(input);
    assertNotFuture(data.startAt, "The start");

    const [first] = await db
      .select({ at: relapse.at })
      .from(relapse)
      .where(eq(relapse.userId, userId))
      .orderBy(asc(relapse.at))
      .limit(1);
    if (first && new Date(data.startAt) > first.at) {
      throw new UserError("The start must be before your first logged reset.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(profile)
        .set({
          displayName: data.displayName,
          startAt: new Date(data.startAt),
          goalDays: data.goalDays,
          reasons: data.reasons,
        })
        .where(eq(profile.userId, userId));

      const existing = await tx
        .select({ id: habit.id })
        .from(habit)
        .where(and(eq(habit.userId, userId), isNull(habit.archivedAt)));
      const existingIds = new Set(existing.map((e) => e.id));
      const keptIds = new Set<string>();

      const rows = habitRows(userId, data.habits);
      const inserts: typeof rows = [];
      for (const [i, h] of data.habits.entries()) {
        const row = rows[i];
        if (h.id && existingIds.has(h.id)) {
          keptIds.add(h.id);
          await tx
            .update(habit)
            .set({ name: row.name, kind: row.kind, target: row.target, unit: row.unit, position: row.position })
            .where(and(eq(habit.id, h.id), eq(habit.userId, userId)));
        } else {
          inserts.push(row);
        }
      }
      if (inserts.length) await tx.insert(habit).values(inserts);
      for (const hid of existingIds) {
        if (!keptIds.has(hid)) {
          await tx
            .update(habit)
            .set({ archivedAt: new Date() })
            .where(and(eq(habit.id, hid), eq(habit.userId, userId)));
        }
      }
    });

    const active = await db
      .select()
      .from(habit)
      .where(and(eq(habit.userId, userId), isNull(habit.archivedAt)))
      .orderBy(asc(habit.position), asc(habit.createdAt));
    return active.map(toHabit);
  });
}

export async function eraseAll(): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    await db.transaction(async (tx) => {
      await tx.delete(dayLog).where(eq(dayLog.userId, userId));
      await tx.delete(relapse).where(eq(relapse.userId, userId));
      await tx.delete(habit).where(eq(habit.userId, userId));
      await tx.delete(profile).where(eq(profile.userId, userId));
    });
    return null;
  });
}

/* ------------------------------------------------------------------------- */
/* Import: accepts this app's backups and the original single-page tracker's. */

const clampScale = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};
const isDateKey = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k);
const validIso = (s: string) => !Number.isNaN(new Date(s).getTime());

export async function importBackup(json: string): Promise<ActionResult> {
  return run(async () => {
    const userId = await requireUserId();
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new UserError("That file isn't valid JSON.");
    }
    const version = (raw as { version?: unknown })?.version;

    type Norm = {
      profile: { displayName: string; startAt: Date; goalDays: number; reasons: string[] };
      habits: { oldId: string; name: string; kind: "check" | "count"; target: number; unit: string | null }[];
      logs: {
        date: string;
        mood: number | null;
        energy: number | null;
        urge: number | null;
        resisted: number;
        note: string | null;
        habits: Record<string, number>;
      }[];
      relapses: { at: Date; trigger: string | null; note: string | null }[];
    };
    let n: Norm;

    if (version === 1) {
      const b = legacyBackupSchema.parse(raw);
      if (!validIso(b.profile.startAt)) throw new UserError("The backup's start date isn't valid.");
      n = {
        profile: {
          displayName: (b.profile.name ?? "").replace(/\s*\(sample\)$/, "").slice(0, 40),
          startAt: new Date(b.profile.startAt),
          goalDays: Math.max(7, Math.min(1000, Math.round(b.profile.goal ?? 182))),
          reasons: (b.profile.reasons ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 12),
        },
        habits: b.profile.habits.slice(0, 20).map((h) => ({
          oldId: h.id,
          name: h.name.slice(0, 40) || "Habit",
          kind: h.type,
          target: h.type === "count" ? Math.max(1, Math.min(99, Math.round(h.target ?? 1))) : 1,
          unit: h.type === "count" ? (h.unit ?? "per day").slice(0, 20) : null,
        })),
        logs: Object.values(b.months).flatMap((m) =>
          Object.entries(m.days)
            .filter(([k]) => isDateKey(k))
            .map(([date, d]) => ({
              date,
              mood: clampScale(d.mood),
              energy: clampScale(d.energy),
              urge: clampScale(d.urge),
              resisted: Math.max(0, Math.min(999, Math.round(d.resisted ?? 0))),
              note: d.note ? d.note.slice(0, 5000) : null,
              habits: Object.fromEntries(
                Object.entries(d.h ?? {}).map(([k, v]) => [k, typeof v === "boolean" ? (v ? 1 : 0) : Math.max(0, Math.min(999, v))]),
              ),
            })),
        ),
        relapses: b.profile.relapses
          .filter((r) => validIso(r.at))
          .map((r) => ({ at: new Date(r.at), trigger: r.trigger?.slice(0, 40) ?? null, note: r.note?.slice(0, 1000) ?? null })),
      };
    } else if (version === 2) {
      const b = appBackupSchema.parse(raw);
      n = {
        profile: { ...b.profile, startAt: new Date(b.profile.startAt) },
        habits: b.habits.map((h) => ({ oldId: h.id, name: h.name, kind: h.kind, target: h.target, unit: h.unit })),
        logs: b.logs,
        relapses: b.relapses.map((r) => ({ at: new Date(r.at), trigger: r.trigger, note: r.note })),
      };
    } else {
      throw new UserError("That file isn't a Reclaim 180 backup.");
    }

    // New ids for habits; remap each day's values to them.
    const idMap = new Map(n.habits.map((h) => [h.oldId, crypto.randomUUID()]));
    const habitValues = n.habits.map((h, i) => ({
      id: idMap.get(h.oldId)!,
      userId,
      name: h.name,
      kind: h.kind,
      target: h.target,
      unit: h.unit,
      position: i,
    }));
    const logValues = n.logs.map((l) => ({
      userId,
      ...l,
      habits: Object.fromEntries(
        Object.entries(l.habits)
          .filter(([k]) => idMap.has(k))
          .map(([k, v]) => [idMap.get(k)!, v]),
      ),
    }));

    // All or nothing: a failed import leaves the old data untouched.
    await db.transaction(async (tx) => {
      await tx.delete(dayLog).where(eq(dayLog.userId, userId));
      await tx.delete(relapse).where(eq(relapse.userId, userId));
      await tx.delete(habit).where(eq(habit.userId, userId));
      await tx.delete(profile).where(eq(profile.userId, userId));
      await tx.insert(profile).values({ userId, ...n.profile });
      if (habitValues.length) await tx.insert(habit).values(habitValues);
      for (let i = 0; i < logValues.length; i += 300) await tx.insert(dayLog).values(logValues.slice(i, i + 300));
      if (n.relapses.length) {
        await tx.insert(relapse).values(n.relapses.map((r) => ({ id: crypto.randomUUID(), userId, ...r })));
      }
    });
    return null;
  });
}
