"use client";

import { authClient } from "./auth-client";
import { forgetLocalData } from "./look";

let leaving = false;

/** True once sign-out has succeeded and the page is about to go. "Leave this page?" warnings check it so they don't ask twice. */
export const isSigningOut = () => leaving;

/**
 * Signs out, clears what the app kept in this browser (theme, unsaved check-ins, dismissed tips),
 * then loads the home page fresh so no private data stays in memory.
 * Returns an error message if the server couldn't be reached; the user stays signed in then.
 */
export async function signOutAndLeave(): Promise<string | null> {
  const res = await authClient.signOut().catch(() => null);
  if (!res || res.error) return "Couldn't sign out. Check your connection and try again.";
  forgetLocalData();
  leaving = true;
  window.location.replace("/");
  return null;
}
