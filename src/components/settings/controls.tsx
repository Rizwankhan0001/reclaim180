"use client";

import { useState, type ReactNode } from "react";
import { PlusIcon, XIcon } from "@/components/icons";

/** A settings section card with an anchor for the side navigation. */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="card scroll-mt-20 !p-5 sm:!p-7" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-[21px] font-bold">
        {title}
      </h2>
      {description && <p className="mt-1 max-w-[62ch] text-[14px] text-muted">{description}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

/** On/off switch with a label and an optional description. */
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-left hover:border-faint"
    >
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold">{label}</span>
        {description && <span className="block text-[12.5px] text-muted">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? "bg-accent" : "bg-heat-0"}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

/** Editable list of short strings: chips with remove buttons and an add field. */
export function ListEditor({
  items,
  onChange,
  max,
  maxLength,
  placeholder,
  addLabel = "Add",
  emptyText,
  variant = "chips",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  maxLength: number;
  placeholder: string;
  addLabel?: string;
  emptyText?: string;
  variant?: "chips" | "rows";
}) {
  const [draft, setDraft] = useState("");
  const full = items.length >= max;

  function add() {
    const t = draft.trim().slice(0, maxLength);
    if (!t || full || items.some((i) => i.toLowerCase() === t.toLowerCase())) return;
    onChange([...items, t]);
    setDraft("");
  }

  return (
    <div className="grid gap-3">
      {items.length === 0 && emptyText && <p className="empty !py-3">{emptyText}</p>}
      {variant === "chips" ? (
        items.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {items.map((it) => (
              <li key={it} className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-surface-2 py-0.5 pr-0.5 pl-3 text-[13.5px] font-medium">
                {it}
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"
                  aria-label={`Remove ${it}`}
                  onClick={() => onChange(items.filter((x) => x !== it))}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        items.length > 0 && (
          <ul className="grid gap-1.5">
            {items.map((it) => (
              <li key={it} className="flex items-center justify-between gap-2 rounded-xl bg-accent-soft py-2 pr-2 pl-3.5 text-[14.5px] font-semibold">
                {it}
                <button
                  type="button"
                  className="grid h-8 w-8 flex-none place-items-center rounded-lg hover:bg-surface/60"
                  aria-label={`Remove "${it}"`}
                  onClick={() => onChange(items.filter((x) => x !== it))}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )
      )}
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={full ? `You can have up to ${max}.` : placeholder}
          value={draft}
          maxLength={maxLength}
          disabled={full}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn" onClick={add} disabled={!draft.trim() || full}>
          <PlusIcon /> {addLabel}
        </button>
      </div>
    </div>
  );
}
