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

/**
 * Some hosts add things to <head> that React didn't render. Netlify's free plan inserts
 * " <!-- This site is hosted on Netlify… -->" right after <meta charset>; the stray space makes
 * React's hydration fail on every page, so it throws the server HTML away and redraws it.
 * This removes whitespace-only text and HTML comments from <head> (React renders neither there)
 * before React loads. It runs from <head>, after the inserted nodes already exist.
 */
export const headCleanupScript = `(function(){try{var h=document.head,n=h.firstChild,x;while(n){x=n.nextSibling;if((n.nodeType===3&&!/\\S/.test(n.nodeValue))||n.nodeType===8)h.removeChild(n);n=x}}catch(e){}})()`;

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
