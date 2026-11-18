import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/* All timestamps are stored as timestamptz. */
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const now = () => new Date();

/* ---------------------------------------------------------------------------
 * Auth tables (managed by Better Auth)
 * ------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().$onUpdate(now).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: ts("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().$onUpdate(now).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ts("access_token_expires_at"),
    refreshTokenExpiresAt: ts("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().$onUpdate(now).notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: ts("expires_at").notNull(),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().$onUpdate(now).notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ---------------------------------------------------------------------------
 * Tracker tables
 * ------------------------------------------------------------------------- */

/** One row per user: their program settings. */
export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 100 }).notNull().default(""),
  /** When the program (and the first streak) began. */
  startAt: ts("start_at").notNull(),
  goalDays: integer("goal_days").notNull().default(182),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().$onUpdate(now).notNull(),
});

/** Daily habits. Removed habits are archived so past logs keep their meaning. */
export const habit = pgTable(
  "habit",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    kind: text("kind", { enum: ["check", "count"] }).notNull().default("check"),
    target: integer("target").notNull().default(1),
    unit: varchar("unit", { length: 50 }),
    position: integer("position").notNull().default(0),
    archivedAt: ts("archived_at"),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("habit_user_idx").on(t.userId)],
);

/** One row per user per calendar day (in the user's own time zone). */
export const dayLog = pgTable(
  "day_log",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    mood: smallint("mood"),
    energy: smallint("energy"),
    urge: smallint("urge"),
    /** Urges the user got through without relapsing. */
    resisted: integer("resisted").notNull().default(0),
    note: text("note"),
    /** habit id -> value (1/0 for yes/no habits, a count for counted habits) */
    habits: jsonb("habits").$type<Record<string, number>>().notNull().default({}),
    updatedAt: ts("updated_at").defaultNow().$onUpdate(now).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] })],
);

/** A logged relapse. Each one ends the current streak. */
export const relapse = pgTable(
  "relapse",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    at: ts("at").notNull(),
    trigger: varchar("trigger", { length: 100 }),
    note: text("note"),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("relapse_user_at_idx").on(t.userId, t.at)],
);
