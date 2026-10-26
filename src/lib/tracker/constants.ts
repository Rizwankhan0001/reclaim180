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
    name: "Withdrawal",
    tip: "The first week is the loudest. Keep your hands busy, your phone out of the bedroom, and your days full.",
  },
  {
    to: 30,
    name: "Adjustment",
    tip: "Energy and motivation can dip in weeks 2 to 4 (the community calls it the flatline). It passes. Keep the habits going even when they feel flat.",
  },
  {
    to: 90,
    name: "Rewiring",
    tip: "This is where the habits start to carry you. Protect your sleep and keep your evenings planned.",
  },
  {
    to: 182,
    name: "Consolidation",
    tip: "You're building who you are now. Watch out for overconfidence and old triggers sneaking back.",
  },
  {
    to: Number.POSITIVE_INFINITY,
    name: "New normal",
    tip: "Past six months. Keep the routines that got you here.",
  },
] as const;

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
