"use client";

import { useLayoutEffect } from "react";
import { rememberLook } from "@/lib/look";
import type { Preferences } from "@/lib/tracker/preferences";

/**
 * Applies the user's theme and accent to the page while they're in the app.
 * With `remember`, it also stores them so the next visit paints in the right colors
 * from the start (see lookScript in the root layout). Settings previews don't remember.
 */
export function ThemeApplier({ theme, accent, remember = false }: Pick<Preferences, "theme" | "accent"> & { remember?: boolean }) {
  // Layout effect: runs before paint, so switching pages or previewing never flashes the wrong colors.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    if (accent === "ember") delete root.dataset.accent;
    else root.dataset.accent = accent;
    if (remember) rememberLook(theme, accent);
    return () => {
      delete root.dataset.theme;
      delete root.dataset.accent;
    };
  }, [theme, accent, remember]);
  return null;
}
