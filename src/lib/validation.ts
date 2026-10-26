import { z } from "zod";

const scale = z.number().int().min(1).max(5).nullable();

export const habitDraftSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Every habit needs a name.").max(40),
  kind: z.enum(["check", "count"]),
  target: z.number().int().min(1).max(99),
  unit: z.string().trim().max(20).nullable(),
});

export const profileInputSchema = z.object({
  displayName: z.string().trim().max(40),
  startAt: z.iso.datetime({ offset: true }),
  goalDays: z.number().int().min(7).max(1000),
  reasons: z.array(z.string().trim().min(1).max(200)).max(12),
});

export const createProfileSchema = profileInputSchema.extend({
  habits: z.array(habitDraftSchema).max(20),
});

export const saveSettingsSchema = createProfileSchema;

export const dayLogSchema = z.object({
  date: z.iso.date(),
  mood: scale,
  energy: scale,
  urge: scale,
  resisted: z.number().int().min(0).max(999),
  note: z.string().max(5000).nullable(),
  habits: z.record(z.string().max(64), z.number().min(0).max(999)),
});

export const relapseInputSchema = z.object({
  at: z.iso.datetime({ offset: true }),
  trigger: z.string().max(40).nullable(),
  note: z.string().max(1000).nullable(),
});

/** Backup exported by this app. */
export const appBackupSchema = z.object({
  app: z.literal("reclaim180"),
  version: z.literal(2),
  profile: profileInputSchema,
  habits: z.array(habitDraftSchema.extend({ id: z.string() })),
  logs: z.array(dayLogSchema),
  relapses: z.array(relapseInputSchema),
});

/** Backup exported by the original single-page tracker. */
export const legacyBackupSchema = z.object({
  app: z.literal("reclaim180"),
  version: z.literal(1),
  profile: z.object({
    name: z.string().optional().default(""),
    startAt: z.string(),
    goal: z.number().optional().default(182),
    habits: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(["check", "count"]).optional().default("check"),
          target: z.number().optional(),
          unit: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
    reasons: z.array(z.string()).optional().default([]),
    relapses: z
      .array(z.object({ at: z.string(), trigger: z.string().nullable().optional(), note: z.string().nullable().optional() }))
      .optional()
      .default([]),
  }),
  months: z
    .record(
      z.string(),
      z.object({
        days: z
          .record(
            z.string(),
            z.object({
              h: z.record(z.string(), z.union([z.boolean(), z.number()])).optional().default({}),
              mood: z.number().nullable().optional(),
              energy: z.number().nullable().optional(),
              urge: z.number().nullable().optional(),
              resisted: z.number().optional(),
              note: z.string().nullable().optional(),
            }),
          )
          .optional()
          .default({}),
      }),
    )
    .optional()
    .default({}),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type DayLogInput = z.infer<typeof dayLogSchema>;
export type RelapseInput = z.infer<typeof relapseInputSchema>;
