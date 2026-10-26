"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { deleteRelapse, eraseAll, importBackup, logRelapse, saveSettings } from "@/app/actions";
import { PlusIcon, XIcon } from "@/components/icons";
import { Modal } from "@/components/ui/modal";
import { authClient } from "@/lib/auth-client";
import { useNow } from "@/lib/hooks";
import { SOS_ACTIONS, TRIGGERS } from "@/lib/tracker/constants";
import { fromLocalInput, pad, toLocalInput } from "@/lib/tracker/dates";
import type { Habit, HabitDraft, Profile, Relapse } from "@/lib/tracker/types";

function ErrorNote({ error }: { error: string | null }) {
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
  onWin,
}: {
  open: boolean;
  onClose: () => void;
  reasons: string[];
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
      <SosBody reasons={reasons} onWin={onWin} />
    </Modal>
  );
}

const BREATH = ["Breathe in", "Hold", "Breathe out", "Hold"] as const;

function SosBody({ reasons, onWin }: { reasons: string[]; onWin: () => void }) {
  const [openedAt] = useState(() => Date.now());
  const now = useNow(1000);
  const elapsed = Math.max(0, Math.floor((now - openedAt) / 1000));
  const phase = Math.floor(elapsed / 4) % 4;
  const count = 4 - (elapsed % 4);
  const inhale = phase === 0 || phase === 1;

  return (
    <div className="grid justify-items-center gap-4 text-center">
      <div className="relative my-1 grid h-[200px] w-[200px] place-items-center">
        <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-line" />
        <div className="orb" data-in={inhale} />
        <div className="relative text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.25)]">
          <b className="block font-display text-[22px] font-bold">{BREATH[phase]}</b>
          <small className="num opacity-85">{count}</small>
        </div>
      </div>
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
      <div className="flex flex-wrap justify-center gap-1.5">
        {SOS_ACTIONS.map((a) => (
          <span key={a} className="tag">
            {a}
          </span>
        ))}
      </div>
      <button type="button" className="btn btn-primary" onClick={onWin}>
        I got through it
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- Reset --- */

export function ResetDialog({
  open,
  onClose,
  startAt,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  startAt: string;
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
      <ResetForm startAt={startAt} onClose={onClose} onLogged={onLogged} />
    </Modal>
  );
}

function ResetForm({ startAt, onClose, onLogged }: { startAt: string; onClose: () => void; onLogged: (r: Relapse) => void }) {
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
      const res = await logRelapse({ at: at.toISOString(), trigger, note: String(f.get("note") ?? "").trim() || null });
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
      <div className="field">
        <span className="lbl">What set it off?</span>
        <div className="flex flex-wrap gap-1.5">
          {TRIGGERS.map((t) => (
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

/* ----------------------------------------------------------- Settings --- */

type DraftRow = HabitDraft & { key: string };

export function SettingsDialog(props: {
  open: boolean;
  onClose: () => void;
  email: string;
  profile: Profile;
  habits: Habit[];
  relapses: Relapse[];
  onSaved: (p: Profile, hs: Habit[]) => void;
  onRelapseDeleted: (id: string) => void;
}) {
  return (
    <Modal open={props.open} onClose={props.onClose} labelledBy="settingsTitle" title="Settings" description={`Signed in as ${props.email}`}>
      <SettingsForm {...props} />
    </Modal>
  );
}

function SettingsForm({
  onClose,
  profile,
  habits,
  relapses,
  onSaved,
  onRelapseDeleted,
}: Parameters<typeof SettingsDialog>[0]) {
  const router = useRouter();
  const [rows, setRows] = useState<DraftRow[]>(() =>
    habits.map((h) => ({ key: h.id, id: h.id, name: h.name, kind: h.kind, target: h.target, unit: h.unit })),
  );
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const nextKey = useRef(0);

  const update = (key: string, patch: Partial<DraftRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const start = fromLocalInput(String(f.get("startAt") ?? ""));
    if (!start || start.getTime() > Date.now() + 60_000) return setError("Pick a start time that isn't in the future.");
    const p: Profile = {
      displayName: String(f.get("displayName") ?? "").trim(),
      startAt: start.toISOString(),
      goalDays: Math.max(7, Math.min(1000, Math.round(Number(f.get("goalDays")) || 182))),
      reasons: String(f.get("reasons") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    };
    const drafts = rows.map(({ id, name, kind, target, unit }) => ({
      ...(id ? { id } : {}),
      name: name.trim() || "Habit",
      kind,
      target: kind === "count" ? Math.max(1, Math.min(99, Math.round(target) || 1)) : 1,
      unit: kind === "count" ? unit?.trim() || "per day" : null,
    }));
    startTransition(async () => {
      const res = await saveSettings({ ...p, habits: drafts });
      if (!res.ok) return setError(res.error);
      onSaved(p, res.data);
    });
  }

  function onImport(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const res = await importBackup(await file.text());
      if (!res.ok) return setError(res.error);
      window.location.reload();
    });
  }

  function onErase() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    startTransition(async () => {
      const res = await eraseAll();
      if (!res.ok) return setError(res.error);
      router.replace("/onboarding");
      router.refresh();
    });
  }

  function onRemoveReset(id: string) {
    startTransition(async () => {
      const res = await deleteRelapse(id);
      if (!res.ok) return setError(res.error);
      onRelapseDeleted(id);
    });
  }

  async function onSignOut() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="displayName">Name</label>
          <input id="displayName" name="displayName" className="input" defaultValue={profile.displayName} maxLength={40} />
        </div>
        <div className="field">
          <label htmlFor="goalDays">Goal (days)</label>
          <input id="goalDays" name="goalDays" type="number" min={7} max={1000} className="input" defaultValue={profile.goalDays} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="startAt">Program start</label>
        <input id="startAt" name="startAt" type="datetime-local" className="input" defaultValue={toLocalInput(new Date(profile.startAt))} />
        <span className="hint">The day your tracker began. Logged resets are kept separately.</span>
      </div>

      <div className="grid gap-3 border-t border-line pt-3.5">
        <h3 className="text-[15px] font-bold">Daily habits</h3>
        <ul className="grid gap-1.5">
          {rows.length === 0 && <li className="hint">No habits. Add one below.</li>}
          {rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[1fr_96px_64px_34px] items-center gap-1.5 sm:grid-cols-[1fr_110px_70px_34px]">
              <input
                className="input !py-2"
                aria-label="Habit name"
                value={r.name}
                maxLength={40}
                onChange={(e) => update(r.key, { name: e.target.value })}
              />
              <select
                className="input !py-2"
                aria-label="Habit type"
                value={r.kind}
                onChange={(e) => update(r.key, { kind: e.target.value as DraftRow["kind"] })}
              >
                <option value="check">Yes / no</option>
                <option value="count">Count</option>
              </select>
              <input
                className="input !py-2"
                type="number"
                min={1}
                max={99}
                aria-label="Daily target"
                value={r.kind === "count" ? r.target : 1}
                disabled={r.kind !== "count"}
                onChange={(e) => update(r.key, { target: Number(e.target.value) })}
              />
              <button
                type="button"
                className="icon-btn !h-[34px] !w-[34px]"
                aria-label={`Remove ${r.name}`}
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              >
                <XIcon />
              </button>
            </li>
          ))}
        </ul>
        <div>
          <button
            type="button"
            className="btn"
            disabled={rows.length >= 20}
            onClick={() =>
              setRows((rs) => [...rs, { key: `new-${nextKey.current++}`, name: "", kind: "check", target: 1, unit: null }])
            }
          >
            <PlusIcon /> Add habit
          </button>
        </div>
        <p className="hint">Removed habits are archived, so your past days keep their history.</p>
      </div>

      <div className="field border-t border-line pt-3.5">
        <label htmlFor="reasons">Your reasons</label>
        <textarea id="reasons" name="reasons" className="input" defaultValue={profile.reasons.join("\n")} placeholder="One per line" />
      </div>

      {relapses.length > 0 && (
        <div className="grid gap-2 border-t border-line pt-3.5">
          <h3 className="text-[15px] font-bold">Logged resets</h3>
          <ul className="grid gap-1">
            {[...relapses].reverse().map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-[13.5px] text-muted">
                <span>
                  {new Date(r.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  {r.trigger ? ` · ${r.trigger}` : ""}
                </span>
                <button
                  type="button"
                  className="icon-btn !h-8 !w-8"
                  aria-label="Delete this reset"
                  disabled={pending}
                  onClick={() => onRemoveReset(r.id)}
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-2.5 border-t border-line pt-3.5">
        <h3 className="text-[15px] font-bold">Your data</h3>
        <div className="flex flex-wrap gap-2">
          <a className="btn" href="/api/export" download>
            Export backup
          </a>
          <label className="btn cursor-pointer">
            Import backup
            <input type="file" accept="application/json,.json" className="sr-only" disabled={pending} onChange={(e) => onImport(e.target.files?.[0])} />
          </label>
          <button type="button" className={`btn btn-danger ${armed ? "armed" : ""}`} disabled={pending} onClick={onErase}>
            {armed ? "Click again to erase all data" : "Erase everything"}
          </button>
          <button type="button" className="btn btn-quiet" onClick={onSignOut}>
            Sign out
          </button>
        </div>
        <span className="hint">Importing replaces everything currently in your tracker.</span>
      </div>

      <ErrorNote error={error} />
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
