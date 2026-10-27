import type { HabitDraft } from "./types";

export const HABIT_LIBRARY: (HabitDraft & { key: string; suggested: boolean })[] = [
  { key: "workout", name: "Move 30 minutes", kind: "check", target: 1, unit: null, suggested: true },
  { key: "meditate", name: "Meditate 10 minutes", kind: "check", target: 1, unit: null, suggested: true },
  { key: "cold", name: "Cold shower", kind: "check", target: 1, unit: null, suggested: true },
  { key: "read", name: "Read 20 pages", kind: "check", target: 1, unit: null, suggested: true },
  { key: "sleep", name: "In bed by 11pm", kind: "check", target: 1, unit: null, suggested: true },
  { key: "nophone", name: "No phone in bed", kind: "check", target: 1, unit: null, suggested: true },
  { key: "water", name: "Water", kind: "count", target: 8, unit: "glasses", suggested: true },
  { key: "journal", name: "Journal", kind: "check", target: 1, unit: null, suggested: false },
  { key: "outside", name: "Time outside", kind: "check", target: 1, unit: null, suggested: false },
  { key: "noscroll", name: "No mindless scrolling", kind: "check", target: 1, unit: null, suggested: false },
];

export const TRIGGERS = [
  "Boredom",
  "Stress",
  "Late night",
  "Lonely",
  "Social media",
  "Tired",
  "Anxious",
  "Alcohol",
  "Other",
] as const;

export const PHASES = [
  {
    to: 7,
    from: 0,
    name: "Withdrawal",
    range: "Days 1–7",
    tip: "The first week is the loudest. Keep your hands busy, your phone out of the bedroom, and your days full.",
    detail: "Urges are strongest and most frequent. Structure your days and keep your phone out of the bedroom.",
  },
  {
    to: 30,
    from: 7,
    name: "Adjustment",
    range: "Days 8–30",
    tip: "Energy and motivation can dip in weeks 2 to 4 (the community calls it the flatline). It passes. Keep the habits going even when they feel flat.",
    detail: "Motivation can dip and days can feel flat. Keep the habits going even when they feel pointless.",
  },
  {
    to: 90,
    from: 30,
    name: "Rewiring",
    range: "Days 31–90",
    tip: "This is where the habits start to carry you. Protect your sleep and keep your evenings planned.",
    detail: "Habits start to carry you. Most people notice better focus, sleep and confidence here.",
  },
  {
    to: 182,
    from: 90,
    name: "Consolidation",
    range: "Days 91–182",
    tip: "You're building who you are now. Watch out for overconfidence and old triggers sneaking back.",
    detail: "The new routine becomes normal. The main risk is overconfidence, so keep checking in.",
  },
  {
    to: Number.POSITIVE_INFINITY,
    from: 182,
    name: "New normal",
    range: "Day 183+",
    tip: "Past six months. Keep the routines that got you here.",
    detail: "Keep the routines that got you here.",
  },
] as const;

/** Words shown on the 1–5 check-in scales. */
export const SCALE_WORDS = {
  mood: ["Awful", "Low", "Okay", "Good", "Great"],
  energy: ["Drained", "Low", "Okay", "Good", "Sharp"],
  urge: ["None", "Mild", "Some", "Strong", "Intense"],
} as const;

/** A practical suggestion for each reset trigger. */
export const TRIGGER_TIPS: Record<string, string> = {
  Boredom: "Plan your free time. Keep a short list of things to do when you have nothing on.",
  Stress: "Swap the release for movement: a 10-minute walk or 20 push-ups when stress peaks.",
  "Late night": "Set a hard screen cutoff and charge your phone outside the bedroom.",
  Lonely: "Reach out before the evening gets quiet: text a friend or get out of the house.",
  "Social media": "Remove the apps that pull you in, or move them off your home screen.",
  Tired: "Protect your sleep. Most slips happen when you're worn out and your guard is down.",
  Anxious: "Use the SOS breathing timer as soon as anxiety rises, before the urge builds.",
  Alcohol: "Decide your plan before you drink, and keep your phone away when you get home.",
  Other: "Write down what happened right before. Patterns show up after a few entries.",
  "Not noted": "Next time, note the trigger. It's the fastest way to see your patterns.",
};

export const SOS_ACTIONS = [
  "Stand up and leave the room",
  "20 push-ups",
  "Cold water on your face",
  "Text a friend",
  "Walk outside for 10 min",
  "Phone in another room",
];

export const GOAL_OPTIONS = [
  { days: 90, label: "90 days" },
  { days: 182, label: "6 months" },
  { days: 365, label: "1 year" },
];
