/*
 * User preferences: everything a person can customize about their tracker.
 * Stored as one JSON value on the profile. Missing or invalid fields fall back
 * to defaults, so older accounts and future additions never break.
 */
import { SOS_ACTIONS, TRIGGERS } from "./constants";

export const ACCENTS = [
  { key: "ember", label: "Ember", swatch: "#e06e2d" },
  { key: "ocean", label: "Ocean", swatch: "#2f7fe0" },
  { key: "forest", label: "Forest", swatch: "#2f9a57" },
  { key: "violet", label: "Violet", swatch: "#8457e0" },
  { key: "rose", label: "Rose", swatch: "#dc4a74" },
] as const;
export type AccentKey = (typeof ACCENTS)[number]["key"];

export const THEMES = [
  { key: "system", label: "Auto" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
] as const;
export type ThemeKey = (typeof THEMES)[number]["key"];

export const BREATHING = [
  {
    key: "box",
    label: "Box breathing",
    desc: "In 4, hold 4, out 4, hold 4. Steady and easy to follow.",
    steps: [
      { word: "Breathe in", secs: 4, big: true },
      { word: "Hold", secs: 4, big: true },
      { word: "Breathe out", secs: 4, big: false },
      { word: "Hold", secs: 4, big: false },
    ],
  },
  {
    key: "478",
    label: "4-7-8 breathing",
    desc: "In 4, hold 7, out 8. Slows you down fast when you feel wound up.",
    steps: [
      { word: "Breathe in", secs: 4, big: true },
      { word: "Hold", secs: 7, big: true },
      { word: "Breathe out", secs: 8, big: false },
    ],
  },
  {
    key: "calm",
    label: "Calm breathing",
    desc: "In 4, out 6. Simple, with a longer breath out.",
    steps: [
      { word: "Breathe in", secs: 4, big: true },
      { word: "Breathe out", secs: 6, big: false },
    ],
  },
] as const;
export type BreathingKey = (typeof BREATHING)[number]["key"];

export const CHECKIN_FIELDS = [
  { key: "mood", label: "Mood", desc: "How you felt overall" },
  { key: "energy", label: "Energy", desc: "How much energy you had" },
  { key: "urge", label: "Urges", desc: "How strong urges were" },
  { key: "journal", label: "Journal", desc: "A short note about the day" },
  { key: "resisted", label: "Urges beaten", desc: "A counter for urges you got through" },
] as const;
export type CheckinKey = (typeof CHECKIN_FIELDS)[number]["key"];

export const DASHBOARD_SECTIONS = [
  { key: "milestones", label: "Milestone badges", desc: "The row of badges under your streak" },
  { key: "week", label: "This week", desc: "Bar chart of the last 7 days" },
  { key: "map", label: "Day map", desc: "Your whole program, one square per day" },
  { key: "trend", label: "Mood vs. urges", desc: "30-day chart with a weekly summary" },
  { key: "strength", label: "Habit strength", desc: "How consistent each habit is" },
  { key: "triggers", label: "What trips you up", desc: "Patterns from your resets" },
  { key: "journal", label: "Journal", desc: "Your notes and resets" },
] as const;
export type SectionKey = (typeof DASHBOARD_SECTIONS)[number]["key"];

export type Preferences = {
  theme: ThemeKey;
  accent: AccentKey;
  /** 0 = Sunday, 1 = Monday */
  weekStart: 0 | 1;
  mantra: string;
  breathing: BreathingKey;
  checkin: Record<CheckinKey, boolean>;
  sections: Record<SectionKey, boolean>;
  sosActions: string[];
  triggers: string[];
  /** milestone day (as a string) -> the reward the user promised themselves */
  rewards: Record<string, string>;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  accent: "ember",
  weekStart: 1,
  mantra: "",
  breathing: "box",
  checkin: { mood: true, energy: true, urge: true, journal: true, resisted: true },
  sections: { milestones: true, week: true, map: true, trend: true, strength: true, triggers: true, journal: true },
  sosActions: [...SOS_ACTIONS],
  triggers: [...TRIGGERS],
  rewards: {},
};

const pick = <T extends string>(v: unknown, allowed: readonly { key: T }[], fallback: T): T =>
  allowed.some((a) => a.key === v) ? (v as T) : fallback;

const strList = (v: unknown, fallback: string[], max: number, len: number) =>
  Array.isArray(v)
    ? v
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim().slice(0, len))
        .filter(Boolean)
        .slice(0, max)
    : fallback;

const flags = <K extends string>(v: unknown, defaults: Record<K, boolean>): Record<K, boolean> => {
  const out = { ...defaults };
  if (v && typeof v === "object") {
    for (const k of Object.keys(defaults) as K[]) {
      const x = (v as Record<string, unknown>)[k];
      if (typeof x === "boolean") out[k] = x;
    }
  }
  return out;
};

/** Fills gaps with defaults and drops anything invalid. Safe on any input. */
export function normalizePreferences(raw: unknown): Preferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rewards: Record<string, string> = {};
  if (r.rewards && typeof r.rewards === "object") {
    for (const [k, v] of Object.entries(r.rewards as Record<string, unknown>)) {
      if (/^\d{1,4}$/.test(k) && typeof v === "string" && v.trim()) rewards[k] = v.trim().slice(0, 80);
    }
  }
  return {
    theme: pick(r.theme, THEMES, DEFAULT_PREFERENCES.theme),
    accent: pick(r.accent, ACCENTS, DEFAULT_PREFERENCES.accent),
    weekStart: r.weekStart === 0 ? 0 : 1,
    mantra: typeof r.mantra === "string" ? r.mantra.trim().slice(0, 120) : "",
    breathing: pick(r.breathing, BREATHING, DEFAULT_PREFERENCES.breathing),
    checkin: flags(r.checkin, DEFAULT_PREFERENCES.checkin),
    sections: flags(r.sections, DEFAULT_PREFERENCES.sections),
    sosActions: strList(r.sosActions, DEFAULT_PREFERENCES.sosActions, 12, 40),
    triggers: strList(r.triggers, DEFAULT_PREFERENCES.triggers, 16, 30),
    rewards,
  };
}
