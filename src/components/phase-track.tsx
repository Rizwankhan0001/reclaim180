import { PHASES } from "@/lib/tracker/constants";

const STAGES = PHASES.slice(0, 4);

/** Where the user is on the road to 182 days: four phases with a "you are here" marker. */
export function PhaseTrack({ days, onDark = false, compact = false }: { days: number | null; onDark?: boolean; compact?: boolean }) {
  let current = -1;
  let pos: number | null = null;
  if (days != null) {
    current = STAGES.findIndex((p) => days < p.to);
    if (current === -1) {
      current = STAGES.length;
      pos = 1;
    } else {
      const p = STAGES[current];
      pos = (current + (days - p.from) / (p.to - p.from)) / STAGES.length;
    }
  }
  const track = onDark ? "bg-white/12" : "bg-heat-0";
  const label = onDark ? "text-night-muted" : "text-muted";
  const strong = onDark ? "text-night-ink" : "text-ink";

  return (
    <div className="w-full" aria-label={days != null ? `Phase ${Math.min(current + 1, 4)} of 4` : "The four phases"}>
      <div className="relative">
        <div className="grid grid-cols-4 gap-1">
          {STAGES.map((p, k) => (
            <div
              key={p.name}
              className={`h-2 rounded-full ${k < current ? "bg-accent" : k === current ? "bg-accent/45" : track}`}
            />
          ))}
        </div>
        {pos != null && (
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-accent shadow-[0_0_0_4px_var(--glow)]"
            style={{ left: `${Math.min(98.5, Math.max(1.5, pos * 100))}%` }}
            title="You are here"
          />
        )}
      </div>
      {compact && days != null && (
        <div className={`mt-2 flex items-baseline justify-between text-[12px] sm:hidden ${label}`}>
          <span>Phase {Math.min(current + 1, 4)} of 4</span>
          <b className={strong}>{STAGES[Math.min(current, 3)].name}</b>
        </div>
      )}
      <div className={`mt-2 grid-cols-4 gap-1 ${compact && days != null ? "hidden sm:grid" : "grid"}`}>
        {STAGES.map((p, k) => (
          <div key={p.name} className="min-w-0">
            <div className={`truncate font-semibold ${compact ? "text-[11px]" : "text-[12px]"} ${k === current ? strong : label}`} title={p.name}>
              {p.name}
            </div>
            {!compact && <div className={`text-[11px] ${label} truncate opacity-80`}>{p.range}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
