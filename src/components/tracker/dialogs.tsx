"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { ActionResult } from "@/app/actions";
import { Modal } from "@/components/ui/modal";
import { useNow } from "@/lib/hooks";
import { fromLocalInput, pad, toLocalInput } from "@/lib/tracker/dates";
import { BREATHING, type BreathingKey } from "@/lib/tracker/preferences";
import type { Relapse } from "@/lib/tracker/types";

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
      {error}
    </p>
  );
}

/* ---------------------------------------------------------------- SOS --- */

export function SosDialog({
  open,
  onClose,
  reasons,
  actions,
  breathing,
  onWin,
}: {
  open: boolean;
  onClose: () => void;
  reasons: string[];
  actions: string[];
  breathing: BreathingKey;
  onWin: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="sosTitle"
      title="Ride it out"
      description="Urges rise, peak and fade, usually within 15 to 20 minutes. Breathe with the circle."
    >
      <SosBody reasons={reasons} actions={actions} breathing={breathing} onWin={onWin} />
    </Modal>
  );
}

function SosBody({
  reasons,
  actions,
  breathing,
  onWin,
}: {
  reasons: string[];
  actions: string[];
  breathing: BreathingKey;
  onWin: () => void;
}) {
  const pattern = BREATHING.find((b) => b.key === breathing) ?? BREATHING[0];
  const [openedAt] = useState(() => Date.now());
  const now = useNow(1000);
  const elapsed = Math.max(0, Math.floor((now - openedAt) / 1000));

  // Where are we in the breathing cycle?
  const cycle = pattern.steps.reduce((a, s) => a + s.secs, 0);
  let t = elapsed % cycle;
  let step: (typeof pattern.steps)[number] = pattern.steps[0];
  for (const s of pattern.steps) {
    if (t < s.secs) {
      step = s;
      break;
    }
    t -= s.secs;
  }
  const count = step.secs - t;

  return (
    <div className="grid justify-items-center gap-4 text-center">
      <div className="relative my-1 grid h-[200px] w-[200px] place-items-center">
        <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-line" />
        <div className="orb" data-in={step.big} style={{ transitionDuration: `${step.secs}s` }} />
        <div className="relative text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.25)]">
          <b className="block font-display text-[22px] font-bold">{step.word}</b>
          <small className="num opacity-85">{count}</small>
        </div>
      </div>
      <p className="text-[12.5px] text-muted">{pattern.label}</p>
      <p className="num text-[13px] text-muted">
        You&apos;ve held on for{" "}
        <b>
          {Math.floor(elapsed / 60)}:{pad(elapsed % 60)}
        </b>
      </p>
      <ul className="grid w-full gap-1.5 text-left">
        {(reasons.length ? reasons : ["Add your reasons in Settings. They show up here when you need them."]).map((r) => (
          <li key={r} className="rounded-[10px] bg-accent-soft px-3 py-2.5 text-[14.5px] font-semibold">
            {r}
          </li>
        ))}
      </ul>
      {actions.length > 0 && (
        <div className="grid w-full gap-2">
          <span className="eyebrow">Do one of these now</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {actions.map((a) => (
              <span key={a} className="tag !px-2.5 !py-1 !text-[12.5px]">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
      <button type="button" className="btn btn-primary" onClick={onWin}>
        I got through it
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- Reset --- */

export type RelapseInput = { at: string; trigger: string | null; note: string | null };

export function ResetDialog({
  open,
  onClose,
  startAt,
  triggers,
  submit,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  startAt: string;
  triggers: string[];
  /** Saves the reset (the server action, or a local stand-in on the demo). */
  submit: (input: RelapseInput) => Promise<ActionResult<Relapse>>;
  onLogged: (r: Relapse) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="resetTitle"
      title="Log a reset"
      description="A reset is information, not failure. Your clean days still count toward your total."
    >
      <ResetForm startAt={startAt} triggers={triggers} submit={submit} onClose={onClose} onLogged={onLogged} />
    </Modal>
  );
}

function ResetForm({
  startAt,
  triggers,
  submit,
  onClose,
  onLogged,
}: {
  startAt: string;
  triggers: string[];
  submit: (input: RelapseInput) => Promise<ActionResult<Relapse>>;
  onClose: () => void;
  onLogged: (r: Relapse) => void;
}) {
  const [trigger, setTrigger] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [defaultAt] = useState(() => toLocalInput(new Date()));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const at = fromLocalInput(String(f.get("at") ?? "")) ?? new Date();
    if (at.getTime() > Date.now() + 60_000) return setError("A reset can't be in the future.");
    if (at < new Date(startAt)) return setError("That's before your program started.");
    startTransition(async () => {
      const res = await submit({ at: at.toISOString(), trigger, note: String(f.get("note") ?? "").trim() || null });
      if (!res.ok) return setError(res.error);
      onLogged(res.data);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="field">
        <label htmlFor="resetAt">When?</label>
        <input id="resetAt" name="at" type="datetime-local" className="input" defaultValue={defaultAt} />
      </div>
      {triggers.length > 0 && (
        <div className="field">
          <span className="lbl">What set it off?</span>
          <div className="flex flex-wrap gap-1.5">
            {triggers.map((t) => (
              <button
                key={t}
                type="button"
                className="opt"
                aria-pressed={trigger === t}
                onClick={() => setTrigger((cur) => (cur === t ? null : t))}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="resetNote">What will you do differently next time?</label>
        <textarea id="resetNote" name="note" className="input" maxLength={1000} placeholder="e.g. Phone stays outside the bedroom after 11pm" />
      </div>
      <ErrorNote error={error} />
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Reset streak"}
        </button>
      </div>
    </form>
  );
}
