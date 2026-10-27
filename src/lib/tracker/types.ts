import type { Preferences } from "./preferences";

export type HabitKind = "check" | "count";

export type Habit = {
  id: string;
  name: string;
  kind: HabitKind;
  target: number;
  unit: string | null;
  position: number;
  /** Icon key from the icon picker, or null to pick one from the name. */
  icon: string | null;
  /** Weekdays the habit applies to (0 = Sunday … 6 = Saturday), or null for every day. */
  days: number[] | null;
};

export type Profile = {
  displayName: string;
  /** ISO timestamp */
  startAt: string;
  goalDays: number;
  reasons: string[];
  preferences: Preferences;
};

export type DayLog = {
  /** YYYY-MM-DD in the user's local time zone */
  date: string;
  mood: number | null;
  energy: number | null;
  urge: number | null;
  resisted: number;
  note: string | null;
  habits: Record<string, number>;
};

export type Relapse = {
  id: string;
  /** ISO timestamp */
  at: string;
  trigger: string | null;
  note: string | null;
};

export type TrackerData = {
  profile: Profile;
  habits: Habit[];
  logs: Record<string, DayLog>;
  relapses: Relapse[];
};

export type HabitDraft = {
  id?: string;
  name: string;
  kind: HabitKind;
  target: number;
  unit: string | null;
  icon?: string | null;
  days?: number[] | null;
};
