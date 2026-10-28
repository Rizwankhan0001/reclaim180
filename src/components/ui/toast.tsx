"use client";

import { createContext, use, useCallback, useRef, useState, type ReactNode } from "react";

type ToastOptions = {
  /** A button inside the toast, e.g. Undo. */
  action?: { label: string; onClick: () => void };
  tone?: "default" | "success";
  /** ms; toasts with an action stay longer by default */
  duration?: number;
};
type ToastFn = (msg: string, opts?: ToastOptions) => void;

const ToastContext = createContext<ToastFn | null>(null);

/**
 * `aboveBottomNav` lifts the toast clear of the phone bottom navigation.
 */
export function ToastProvider({ children, aboveBottomNav = false }: { children: ReactNode; aboveBottomNav?: boolean }) {
  const [state, setState] = useState<{ msg: string; opts: ToastOptions; id: number } | null>(null);
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback<ToastFn>((msg, opts = {}) => {
    setState((s) => ({ msg, opts, id: (s?.id ?? 0) + 1 }));
    setShown(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), opts.duration ?? (opts.action ? 7000 : 2800));
  }, []);

  const success = state?.opts.tone === "success";

  return (
    <ToastContext value={toast}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed left-1/2 z-50 flex w-max max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-3 rounded-2xl py-2.5 pr-2.5 pl-4 text-sm font-semibold shadow-lift transition-all duration-200 ${
          success ? "bg-good text-white" : "bg-ink text-surface"
        } ${shown ? "opacity-100" : "pointer-events-none translate-y-5 opacity-0"} ${
          aboveBottomNav ? "bottom-[calc(96px+env(safe-area-inset-bottom,0px))] md:bottom-[calc(20px+env(safe-area-inset-bottom,0px))]" : "bottom-[calc(20px+env(safe-area-inset-bottom,0px))]"
        }`}
      >
        <span className={state?.opts.action ? "" : "pr-1.5"}>{state?.msg}</span>
        {state?.opts.action && (
          <button
            type="button"
            className="rounded-xl bg-white/15 px-3 py-1.5 text-[13px] font-bold hover:bg-white/25"
            onClick={() => {
              state.opts.action?.onClick();
              setShown(false);
            }}
          >
            {state.opts.action.label}
          </button>
        )}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const t = use(ToastContext);
  if (!t) throw new Error("useToast must be used inside ToastProvider");
  return t;
}
