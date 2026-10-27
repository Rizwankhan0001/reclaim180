/* Static, example-only previews of the app used on the landing page. */
import { CheckIcon, FlagIcon, LockIcon } from "@/components/icons";
import { HabitIcon } from "@/components/habit-icon";
import { PhaseTrack } from "@/components/phase-track";

export function MiniRing({ days, goal, size = 200 }: { days: number; goal: number; size?: number }) {
  const r = 108;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 260 260" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6a56f" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="130" cy="130" r={r} fill="none" stroke="var(--heat-0)" strokeWidth="16" />
        <circle
          cx="130"
          cy="130"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(c * days) / goal} ${c}`}
          transform="rotate(-90 130 130)"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="font-display leading-[0.9] font-extrabold tracking-[-0.04em]" style={{ fontSize: size * 0.3 }}>
          {days}
        </div>
        <div className="mt-1 text-[12px] font-medium text-muted">days clean</div>
      </div>
    </div>
  );
}

const HABITS: [string, boolean][] = [
  ["Move 30 minutes", true],
  ["Cold shower", true],
  ["Read 20 pages", true],
  ["In bed by 11pm", false],
];

export function MiniHabits({ rows = HABITS }: { rows?: [string, boolean][] }) {
  return (
    <ul className="grid gap-1.5">
      {rows.map(([name, done]) => (
        <li
          key={name}
          className={`flex items-center gap-2.5 rounded-[11px] border px-3 py-2 text-[13.5px] font-semibold ${
            done ? "done border-heat-3/40 bg-[color-mix(in_oklab,var(--heat-3)_12%,var(--surface))]" : "border-line bg-surface-2"
          }`}
        >
          <span className="check !h-[22px] !w-[22px] !rounded-[7px]">
            <CheckIcon />
          </span>
          <HabitIcon name={name} className="h-4 w-4 text-muted" />
          <span className="truncate">{name}</span>
        </li>
      ))}
    </ul>
  );
}

export function MiniScale({ label, words, active, warm }: { label: string; words: readonly string[]; active: number; warm?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <div className={`scale-words ${warm ? "warm" : ""}`}>
        {words.map((w, i) => (
          <button key={w} type="button" tabIndex={-1} aria-pressed={i === active}>
            <i />
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Deterministic sample calendar so it renders the same on every load. */
function sampleLevels(n: number) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, (_, i) => {
    if (i === 9 || i === 27) return -1; // resets
    const skill = Math.min(0.92, 0.35 + i / 90);
    const v = rnd() * 0.5 + skill * 0.6;
    return v > 0.85 ? 4 : v > 0.65 ? 3 : v > 0.45 ? 2 : v > 0.25 ? 1 : 0;
  });
}

export function MiniHeatmap({ days = 63, weeks = 13, cell = 14 }: { days?: number; weeks?: number; cell?: number }) {
  const levels = sampleLevels(days);
  return (
    <div className="overflow-hidden">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateRows: `repeat(7, ${cell}px)`, gridAutoFlow: "column", gridAutoColumns: `${cell}px` }}
        aria-hidden="true"
      >
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const l = levels[i];
          const future = i >= days;
          return (
            <span
              key={i}
              className="relative rounded-[3px]"
              style={{
                background: future ? "transparent" : l === -1 ? "var(--heat-1)" : `var(--heat-${l})`,
                border: future ? "1px dashed var(--line)" : undefined,
              }}
            >
              {l === -1 && <i className="absolute inset-[3px] rounded-full bg-bad" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function MiniMilestones({ reached = 5 }: { reached?: number }) {
  const ms = [1, 3, 7, 14, 30, 60, 90, 182];
  return (
    <div className="flex flex-wrap gap-1.5">
      {ms.map((m, i) => {
        const got = i < reached;
        const next = i === reached;
        return (
          <div
            key={m}
            className={`grid w-[54px] justify-items-center gap-0.5 rounded-xl border px-1 py-2 ${
              got ? "border-transparent bg-accent-soft" : next ? "border-accent" : "border-dashed border-line text-faint"
            }`}
          >
            {got || next ? <FlagIcon className={`h-4 w-4 ${got ? "text-accent" : ""}`} /> : <LockIcon className="h-4 w-4" />}
            <b className="num text-[12px]">{m}</b>
          </div>
        );
      })}
    </div>
  );
}

export function MiniSos() {
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <div className="relative grid h-[150px] w-[150px] place-items-center">
        <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-line" />
        <div className="orb" data-in="true" style={{ transform: "scale(0.85)" }} />
        <div className="relative text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.25)]">
          <b className="block font-display text-lg font-bold">Breathe in</b>
          <small className="num opacity-85">3</small>
        </div>
      </div>
      <ul className="grid w-full gap-1.5 text-left">
        {["I want my focus back", "I want to trust myself again"].map((r) => (
          <li key={r} className="rounded-[10px] bg-accent-soft px-3 py-2 text-[13.5px] font-semibold">
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniTriggers() {
  const rows: [string, number][] = [
    ["Late night", 100],
    ["Social media", 66],
    ["Stress", 33],
  ];
  return (
    <div className="grid gap-3">
      <ul className="grid gap-2.5">
        {rows.map(([t, pct], i) => (
          <li key={t} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[13.5px]">
            <span>{t}</span>
            <b className="num text-[12.5px]">{3 - i}×</b>
            <div className="track col-span-2 !h-[7px]">
              <i style={{ width: `${pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="rounded-xl bg-surface-2 p-3 text-[13px] text-muted">
        <b className="text-ink">Tip for late nights:</b> set a hard screen cutoff and charge your phone outside the bedroom.
      </p>
    </div>
  );
}

/** The hero's product shot. */
export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] animate-[float-in_0.7s_ease_both] sm:mb-16 lg:mr-0">
      <div className="rounded-[24px] border border-white/10 bg-surface p-5 text-ink shadow-lift sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            <i className="h-2.5 w-2.5 rounded-full bg-line" />
            <i className="h-2.5 w-2.5 rounded-full bg-line" />
            <i className="h-2.5 w-2.5 rounded-full bg-line" />
          </div>
          <span className="eyebrow !text-faint">Example</span>
        </div>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <MiniRing days={47} goal={182} size={170} />
          <div className="grid w-full min-w-0 gap-3">
            <div className="text-[22px] leading-tight font-bold">
              You&apos;re on <span className="text-accent">day 48.</span>
            </div>
            <div className="flex gap-1.5">
              {[
                ["47", "days"],
                ["09", "hrs"],
                ["26", "min"],
              ].map(([v, l]) => (
                <div key={l} className="grid flex-1 rounded-[10px] border border-line bg-surface-2 px-2.5 py-1.5">
                  <b className="num text-lg font-semibold">{v}</b>
                  <span className="text-[10px] tracking-[0.08em] text-muted uppercase">{l}</span>
                </div>
              ))}
            </div>
            <PhaseTrack days={47} compact />
          </div>
        </div>
        <div className="mt-5 border-t border-line pt-4 sm:pr-[230px]">
          <div className="mb-2 flex items-baseline justify-between text-[12px]">
            <span className="font-bold">Last 9 weeks</span>
            <span className="text-muted">darker = more habits</span>
          </div>
          <MiniHeatmap days={60} weeks={9} cell={13} />
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-6 w-[86%] rounded-[20px] border border-line bg-surface p-4 text-ink shadow-lift sm:absolute sm:-right-6 sm:-bottom-16 sm:mt-0 sm:w-[250px]">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-bold">Today</span>
          <span className="num rounded-full bg-heat-3/15 px-2 py-0.5 text-[12px] font-semibold text-heat-4">3 of 4</span>
        </div>
        <MiniHabits />
      </div>
    </div>
  );
}

export function MiniCustomize() {
  const swatches = ["#e06e2d", "#2f7fe0", "#2f9a57", "#8457e0", "#dc4a74"];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const on = [true, false, true, false, true, false, false];
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <span className="text-[13px] font-bold">Accent color</span>
        <div className="flex gap-2.5">
          {swatches.map((c, i) => (
            <span key={c} className={`h-9 w-9 rounded-full ${i === 2 ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="grid gap-2 rounded-xl border border-line bg-surface-2 p-3">
        <div className="flex items-center gap-2.5 text-[13.5px] font-semibold">
          <HabitIcon name="Gym" className="h-5 w-5 text-accent" /> Gym session
        </div>
        <div className="flex gap-1">
          {days.map((d, i) => (
            <span
              key={i}
              className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${on[i] ? "bg-accent text-accent-ink" : "border border-line bg-surface text-faint"}`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-1.5">
        {[
          ["Mood", true],
          ["Energy", false],
          ["Journal", true],
        ].map(([l, v]) => (
          <div key={l as string} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2 text-[13.5px] font-semibold">
            {l as string}
            <span className={`relative h-5 w-9 rounded-full ${v ? "bg-accent" : "bg-heat-0"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${v ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
