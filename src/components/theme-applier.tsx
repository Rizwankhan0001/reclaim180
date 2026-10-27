"use client";

import { useEffect } from "react";
import type { Preferences } from "@/lib/tracker/preferences";

/** Applies the user's theme and accent to the page while they're in the app. */
export function ThemeApplier({ theme, accent }: Pick<Preferences, "theme" | "accent">) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    if (accent === "ember") delete root.dataset.accent;
    else root.dataset.accent = accent;
    return () => {
      delete root.dataset.theme;
      delete root.dataset.accent;
    };
  }, [theme, accent]);
  return null;
}
