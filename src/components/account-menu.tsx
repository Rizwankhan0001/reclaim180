"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { signOutAndLeave } from "@/lib/sign-out";
import { LogOutIcon, SettingsIcon, ShieldIcon } from "./icons";

const item =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold outline-none hover:bg-surface-2 focus-visible:bg-surface-2 disabled:opacity-60 [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:flex-none";

/**
 * The round button with the user's initial in the header. Opens a small menu with who's signed in,
 * Settings, the privacy policy and Sign out.
 */
export function AccountMenu({
  name,
  email,
  onSettingsPage = false,
  confirmSignOut,
}: {
  name: string;
  email: string;
  /** Leaves out the Settings link when already there. */
  onSettingsPage?: boolean;
  /** Return false to cancel, e.g. after asking about unsaved changes. */
  confirmSignOut?: () => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const initial = (name.trim() || email).charAt(0).toUpperCase() || "?";

  // Close on a tap outside or Escape; move focus into the menu when it opens.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    wrap.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Arrow keys move between items, as in a native menu.
  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  }

  async function signOut() {
    if (confirmSignOut && !confirmSignOut()) return;
    setError(null);
    setPending(true);
    const err = await signOutAndLeave();
    if (err) {
      setPending(false);
      setError(err);
    }
  }

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${name.trim() || email}`}
        onClick={() => setOpen((o) => !o)}
        className={`grid h-10 w-10 place-items-center rounded-full bg-accent font-display text-[16px] font-bold text-accent-ink transition-shadow sm:h-9 sm:w-9 ${
          open ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "hover:ring-2 hover:ring-accent/40 hover:ring-offset-2 hover:ring-offset-bg"
        }`}
      >
        {initial}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKey}
          className="absolute top-full right-0 z-40 mt-2 w-64 max-w-[calc(100vw-24px)] animate-[rise_0.15s_ease] rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-lift"
        >
          <div className="mb-1 border-b border-line px-3 pt-2 pb-2.5">
            {name.trim() && <b className="block truncate text-[14.5px]">{name}</b>}
            <span className="block truncate text-[13px] text-muted">{email}</span>
          </div>
          {!onSettingsPage && (
            <Link role="menuitem" href="/settings" className={item} onClick={() => setOpen(false)}>
              <SettingsIcon className="text-muted" /> Settings
            </Link>
          )}
          <Link role="menuitem" href="/privacy" className={item} onClick={() => setOpen(false)}>
            <ShieldIcon className="text-muted" /> Privacy Policy
          </Link>
          <button role="menuitem" type="button" className={`${item} text-bad`} onClick={signOut} disabled={pending}>
            <LogOutIcon /> {pending ? "Signing out…" : "Sign out"}
          </button>
          {error && (
            <p role="alert" className="px-3 pt-1 pb-2 text-[12.5px] font-medium text-bad">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** A plain "Sign out" button, for pages without the account menu (like first-time setup). */
export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      {error && (
        <span role="alert" className="hidden text-[12.5px] font-medium text-bad sm:inline">
          {error}
        </span>
      )}
      <button
        type="button"
        className="btn btn-quiet !px-3 !py-2"
        disabled={pending}
        onClick={async () => {
          setError(null);
          setPending(true);
          const err = await signOutAndLeave();
          if (err) {
            setPending(false);
            setError(err);
          }
        }}
      >
        <LogOutIcon /> {pending ? "Signing out…" : "Sign out"}
      </button>
    </span>
  );
}
