/* Sample data for the public demo. Built in the visitor's own time zone, never saved. */
import { DAY_MS, keyOf } from "./dates";
import { DEFAULT_PREFERENCES } from "./preferences";
import type { DayLog, Habit, TrackerData } from "./types";

const HABITS: Omit<Habit, "position">[] = [
  { id: "d-move", name: "Move 30 minutes", kind: "check", target: 1, unit: null, icon: null, days: null },
  { id: "d-meditate", name: "Meditate 10 minutes", kind: "check", target: 1, unit: null, icon: null, days: null },
  { id: "d-cold", name: "Cold shower", kind: "check", target: 1, unit: null, icon: null, days: null },
  { id: "d-read", name: "Read 20 pages", kind: "check", target: 1, unit: null, icon: null, days: null },
  { id: "d-sleep", name: "In bed by 11pm", kind: "check", target: 1, unit: null, icon: null, days: null },
  { id: "d-gym", name: "Gym session", kind: "check", target: 1, unit: null, icon: "dumbbell", days: [1, 3, 5] },
  { id: "d-water", name: "Water", kind: "count", target: 8, unit: "glasses", icon: null, days: null },
];

const NOTES: Record<number, string> = {
  1: "Strong urge after a long day. Did the breathing timer and went for a walk instead.",
  5: "Slept 8 hours. Mornings feel easier now.",
  11: "Felt flat all day. Remembered this is normal and stuck to the plan.",
  19: "Cold showers are getting easier. Energy is noticeably up.",
  26: "Best focus at work in months. Finished the report early.",
  41: "Weekend was hard. Went to the gym twice to keep busy.",
};

export function sampleTracker(now = Date.now()): TrackerData {
  let seed = 42;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)));

  const start = new Date(now - 60 * DAY_MS);
  start.setHours(22, 0, 0, 0);
  const r1 = new Date(now - 48 * DAY_MS);
  r1.setHours(23, 40, 0, 0);
  const r2 = new Date(now - 33 * DAY_MS);
  r2.setHours(1, 15, 0, 0);

  const habits: Habit[] = HABITS.map((h, i) => ({ ...h, position: i }));
  const logs: Record<string, DayLog> = {};
  for (let ago = 60; ago >= 1; ago--) {
    if (rnd() < 0.07) continue;
    const d = new Date(now - ago * DAY_MS);
    const k = keyOf(d);
    const progress = (60 - ago) / 60;
    const skill = Math.min(0.93, 0.4 + progress * 0.55);
    const values: Record<string, number> = {};
    for (const h of habits) values[h.id] = h.kind === "count" ? Math.min(10, Math.round(3 + skill * 5 + rnd() * 2)) : rnd() < skill ? 1 : 0;
    const urge = clamp(4.2 - progress * 2.6 + (rnd() - 0.5) * 1.8);
    logs[k] = {
      date: k,
      mood: clamp(2.5 + progress * 2 + (rnd() - 0.5) * 1.6),
      energy: clamp(2.6 + progress * 1.8 + (rnd() - 0.5) * 1.6),
      urge,
      resisted: urge >= 4 ? 1 + Math.floor(rnd() * 2) : 0,
      note: NOTES[ago] ?? null,
      habits: values,
    };
  }
  // Today: partly done, so the visitor can finish the check-in themselves.
  const tk = keyOf(new Date(now));
  logs[tk] = { date: tk, mood: 4, energy: null, urge: 2, resisted: 0, note: null, habits: { "d-move": 1, "d-cold": 1, "d-water": 5 } };

  return {
    profile: {
      displayName: "Alex",
      startAt: start.toISOString(),
      goalDays: 182,
      reasons: ["I want my focus back for work", "I want to be present with people I care about", "I want to trust myself again"],
      preferences: { ...DEFAULT_PREFERENCES, mantra: "One day at a time.", rewards: { "45": "New running shoes", "90": "A weekend trip" } },
    },
    habits,
    logs,
    relapses: [
      { id: "d-r1", at: r1.toISOString(), trigger: "Late night", note: "Too tired, too much time alone on my phone." },
      { id: "d-r2", at: r2.toISOString(), trigger: "Social media", note: "Scrolling in bed. Phone charges in the kitchen now." },
    ],
  };
}
