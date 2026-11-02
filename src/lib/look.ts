/*
 * The user's theme and accent, remembered in this browser so the app can paint in the right
 * colors before React loads. The saved preferences on the server stay the source of truth.
 */

export const LOOK_KEY = "reclaim180:look";

/** Pages that use the user's own theme. Everything else uses the default look. */
const APP_PATHS = "^/(dashboard|settings)(/|$)";

/** Runs in <head> before the first paint. Kept small and defensive: it must never throw. */
export const lookScript = `(function(){try{if(!new RegExp(${JSON.stringify(APP_PATHS)}).test(location.pathname))return;var s=JSON.parse(localStorage.getItem(${JSON.stringify(LOOK_KEY)})||"null");if(!s)return;var r=document.documentElement;if(s.theme==="light"||s.theme==="dark")r.setAttribute("data-theme",s.theme);if(typeof s.accent==="string"&&/^[a-z]{1,12}$/.test(s.accent)&&s.accent!=="ember")r.setAttribute("data-accent",s.accent)}catch(e){}})()`;

/**
 * Chrome on Android announces "this app can be installed" once, often before React has loaded.
 * Keep that event so the dashboard can offer an Install button at a better moment.
 */
export const installScript = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__r180Install=e;window.dispatchEvent(new Event("r180-installable"))})`;

export function rememberLook(theme: string, accent: string) {
  try {
    localStorage.setItem(LOOK_KEY, JSON.stringify({ theme, accent }));
  } catch {}
}

/** Clears everything this app keeps in the browser for the signed-in user (on sign-out, erase or delete). */
export function forgetLocalData() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("reclaim180:")) localStorage.removeItem(k);
    }
  } catch {}
}
