"use client";

import { createContext, use, useCallback, useRef, useState, type ReactNode } from "react";

const ToastContext = createContext<((msg: string) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setShown(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), 2800);
  }, []);

  return (
    <ToastContext value={toast}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-xl bg-ink px-[18px] py-[11px] text-center text-sm font-semibold text-surface transition-all duration-200 ${
          shown ? "opacity-100" : "translate-y-5 opacity-0"
        }`}
        style={{ bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
      >
        {msg}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const t = use(ToastContext);
  if (!t) throw new Error("useToast must be used inside ToastProvider");
  return t;
}
