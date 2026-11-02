"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

/** Links to the terms and privacy policy. They open in a new tab so a half-filled form isn't lost. */
function PolicyLinks() {
  return (
    <>
      <Link href="/terms" target="_blank" className="font-semibold text-ink underline underline-offset-2">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" target="_blank" className="font-semibold text-ink underline underline-offset-2">
        Privacy Policy
      </Link>
    </>
  );
}

export function AuthForm({
  mode,
  googleEnabled,
  resetEnabled = false,
  notice,
}: {
  mode: "sign-in" | "sign-up";
  googleEnabled: boolean;
  /** Shows "Forgot password?" (only when email can be sent). */
  resetEnabled?: boolean;
  /** A message shown above the form, e.g. after a password reset. */
  notice?: ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isSignUp = mode === "sign-up";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const name = String(f.get("name") ?? "").trim();
    if (isSignUp && !f.get("consent")) {
      setError("Please confirm you're 18 or older and agree to the Terms and Privacy Policy.");
      return;
    }
    setPending(true);
    const res = isSignUp
      ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0] })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (res.error) {
      setError(
        res.error.status === 429
          ? "Too many attempts in a short time. Wait a minute, then try again."
          : friendly(res.error.code, res.error.message),
      );
      return;
    }
    router.replace(isSignUp ? "/onboarding" : "/dashboard");
    router.refresh();
  }

  async function google() {
    setPending(true);
    const res = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    if (res?.error) {
      setPending(false);
      setError(friendly(res.error.code, res.error.message));
    }
  }

  return (
    <div className="card mx-auto grid w-full max-w-[440px] gap-5 !p-8 shadow-lift">
      <div>
        <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.02em]">
          {isSignUp ? "Start your 180 days" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isSignUp ? "Create a free account. Your tracker is private to you." : "Sign in to pick up where you left off."}
        </p>
      </div>

      {googleEnabled && (
        <>
          <button type="button" className="btn w-full" onClick={google} disabled={pending}>
            Continue with Google
          </button>
          <p className="-mt-2 text-center text-[12px] text-muted">
            {isSignUp ? "By continuing with Google" : "If you're new, continuing with Google creates an account. By continuing"}, you confirm
            you&apos;re 18 or older and agree to the <PolicyLinks />.
          </p>
          <div className="flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {notice}

      <form onSubmit={onSubmit} className="grid gap-4">
        {isSignUp && (
          <div className="field">
            <label htmlFor="name">First name</label>
            <input id="name" name="name" className="input" autoComplete="given-name" maxLength={40} />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div className="field">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="text-[13px] font-[650]">
              Password
            </label>
            {!isSignUp && resetEnabled && (
              <Link href="/forgot-password" className="-my-2 py-2 text-[13px] font-semibold text-accent">
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              className="input !pr-12"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button
              type="button"
              className="absolute top-1/2 right-1 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
            </button>
          </div>
          {isSignUp && <span className="hint">At least 8 characters.</span>}
        </div>
        {isSignUp && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3 text-[13.5px] text-muted">
            <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 flex-none accent-[var(--accent)]" />
            <span>
              I&apos;m 18 or older, and I agree to the <PolicyLinks />.
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full !py-3" disabled={pending}>
          {pending ? "One moment…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      {isSignUp && (
        <Link href="/demo" className="-my-1 block py-2 text-center text-[13px] text-muted hover:text-ink">
          Not sure yet? <span className="font-semibold text-accent">Try the demo</span> first.
        </Link>
      )}
      <p className="text-center text-sm text-muted">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="inline-block py-1.5 font-semibold text-accent">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

function friendly(code: string | undefined, message: string | undefined): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match. Check them and try again.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Sign in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Use a password with at least 8 characters.";
    case "INVALID_EMAIL":
      return "That email address doesn't look right.";
    default:
      return message || "Something went wrong. Try again.";
  }
}
