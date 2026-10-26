import {
  boolean,
  date,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

/*
 * MySQL notes
 * - All times are DATETIME(3) written by the app in UTC, so the server's time zone never matters.
 * - Defaults for times, ids and JSON are set by the app ($defaultFn), which works on every MySQL host.
 * - Columns that are indexed or unique use VARCHAR, because MySQL can't index TEXT without a length.
 */

const now = () => new Date();
const ts = (name: string) => datetime(name, { mode: "date", fsp: 3 });
const id = (name = "id") => varchar(name, { length: 36 });
const userRef = () =>
  varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/* ---------------------------------------------------------------------------
 * Auth tables (managed by Better Auth)
 * ------------------------------------------------------------------------- */

export const user = mysqlTable("user", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: ts("created_at").$defaultFn(now).notNull(),
  updatedAt: ts("updated_at").$defaultFn(now).$onUpdate(now).notNull(),
});

export const session = mysqlTable(
  "session",
  {
    id: id().primaryKey(),
    expiresAt: ts("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: ts("created_at").$defaultFn(now).notNull(),
    updatedAt: ts("updated_at").$defaultFn(now).$onUpdate(now).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: userRef(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = mysqlTable(
  "account",
  {
    id: id().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: userRef(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ts("access_token_expires_at"),
    refreshTokenExpiresAt: ts("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: ts("created_at").$defaultFn(now).notNull(),
    updatedAt: ts("updated_at").$defaultFn(now).$onUpdate(now).notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = mysqlTable(
  "verification",
  {
    id: id().primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: ts("expires_at").notNull(),
    createdAt: ts("created_at").$defaultFn(now).notNull(),
    updatedAt: ts("updated_at").$defaultFn(now).$onUpdate(now).notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ---------------------------------------------------------------------------
 * Tracker tables
 * ------------------------------------------------------------------------- */

/** One row per user: their program settings. */
export const profile = mysqlTable("profile", {
  userId: id("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 40 }).notNull().default(""),
  /** When the program (and the first streak) began. */
  startAt: ts("start_at").notNull(),
  goalDays: int("goal_days").notNull().default(182),
  reasons: json("reasons").$type<string[]>().notNull().$defaultFn(() => []),
  createdAt: ts("created_at").$defaultFn(now).notNull(),
  updatedAt: ts("updated_at").$defaultFn(now).$onUpdate(now).notNull(),
});

/** Daily habits. Removed habits are archived so past logs keep their meaning. */
export const habit = mysqlTable(
  "habit",
  {
    id: id()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: userRef(),
    name: varchar("name", { length: 40 }).notNull(),
    kind: mysqlEnum("kind", ["check", "count"]).notNull().default("check"),
    target: int("target").notNull().default(1),
    unit: varchar("unit", { length: 20 }),
    position: int("position").notNull().default(0),
    archivedAt: ts("archived_at"),
    createdAt: ts("created_at").$defaultFn(now).notNull(),
  },
  (t) => [index("habit_user_idx").on(t.userId)],
);

/** One row per user per calendar day (in the user's own time zone). */
export const dayLog = mysqlTable(
  "day_log",
  {
    userId: userRef(),
    date: date("date", { mode: "string" }).notNull(),
    mood: smallint("mood"),
    energy: smallint("energy"),
    urge: smallint("urge"),
    /** Urges the user got through without relapsing. */
    resisted: int("resisted").notNull().default(0),
    note: text("note"),
    /** habit id -> value (1/0 for yes/no habits, a count for counted habits) */
    habits: json("habits").$type<Record<string, number>>().notNull().$defaultFn(() => ({})),
    updatedAt: ts("updated_at").$defaultFn(now).$onUpdate(now).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] })],
);

/** A logged relapse. Each one ends the current streak. */
export const relapse = mysqlTable(
  "relapse",
  {
    id: id()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: userRef(),
    at: ts("at").notNull(),
    trigger: varchar("trigger", { length: 40 }),
    note: text("note"),
    createdAt: ts("created_at").$defaultFn(now).notNull(),
  },
  (t) => [index("relapse_user_at_idx").on(t.userId, t.at)],
);
