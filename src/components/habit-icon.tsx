import type { SVGProps } from "react";
import {
  BoltIcon,
  BookIcon,
  ChartIcon,
  CircleCheckIcon,
  DropIcon,
  DumbbellIcon,
  FlameIcon,
  HomeIcon,
  LotusIcon,
  MoonIcon,
  PenIcon,
  PhoneOffIcon,
  SnowIcon,
  SparkIcon,
  SunIcon,
  TrophyIcon,
} from "./icons";

type IconComponent = (p: SVGProps<SVGSVGElement>) => React.JSX.Element;

/** Icons a user can pick for a habit in Settings. */
export const HABIT_ICONS: { key: string; label: string; Icon: IconComponent }[] = [
  { key: "check", label: "Check", Icon: CircleCheckIcon },
  { key: "dumbbell", label: "Workout", Icon: DumbbellIcon },
  { key: "lotus", label: "Meditate", Icon: LotusIcon },
  { key: "snow", label: "Cold", Icon: SnowIcon },
  { key: "book", label: "Read", Icon: BookIcon },
  { key: "moon", label: "Sleep", Icon: MoonIcon },
  { key: "phone", label: "No phone", Icon: PhoneOffIcon },
  { key: "pen", label: "Write", Icon: PenIcon },
  { key: "sun", label: "Outside", Icon: SunIcon },
  { key: "drop", label: "Water", Icon: DropIcon },
  { key: "flame", label: "Energy", Icon: FlameIcon },
  { key: "bolt", label: "Focus", Icon: BoltIcon },
  { key: "spark", label: "Create", Icon: SparkIcon },
  { key: "chart", label: "Work", Icon: ChartIcon },
  { key: "home", label: "Home", Icon: HomeIcon },
  { key: "trophy", label: "Goal", Icon: TrophyIcon },
];

const RULES: [RegExp, IconComponent][] = [
  [/water|drink|hydrat/i, DropIcon],
  [/cold|shower|ice/i, SnowIcon],
  [/medit|breath|yoga|pray/i, LotusIcon],
  [/read|book|study|learn/i, BookIcon],
  [/phone|scroll|screen|social/i, PhoneOffIcon],
  [/sleep|bed|11pm|night/i, MoonIcon],
  [/journal|write|gratitude/i, PenIcon],
  [/outside|walk|sun|nature/i, SunIcon],
  [/move|workout|gym|run|push|exercise|train|sport/i, DumbbellIcon],
];

/** The chosen icon, or one picked from the habit's name, so custom habits get a sensible one too. */
export function HabitIcon({ name, icon, className }: { name: string; icon?: string | null; className?: string }) {
  const chosen = icon ? HABIT_ICONS.find((i) => i.key === icon)?.Icon : undefined;
  const Icon = chosen ?? RULES.find(([re]) => re.test(name))?.[1] ?? CircleCheckIcon;
  return <Icon className={className} />;
}
