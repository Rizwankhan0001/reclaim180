"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XIcon } from "../icons";

/** Native <dialog>, controlled by `open`. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  labelledBy: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  /** Set when this component closes the dialog itself, so that close isn't reported back as the user's. */
  const selfClosed = useRef(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) {
      selfClosed.current = true;
      d.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={labelledBy}
      onClose={() => {
        // The browser fires "close" a moment after close(). By then the dialog may have been
        // opened again, so a close we started ourselves must not call onClose.
        if (selfClosed.current) {
          selfClosed.current = false;
          return;
        }
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="grid gap-4 p-5 sm:p-[22px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={labelledBy} className="text-2xl font-bold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <XIcon />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
