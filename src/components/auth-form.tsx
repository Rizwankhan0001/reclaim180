"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode, googleEnabled }: { mode: "sign-in" | "sign-up"; googleEnabled: boolean }) {
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
          <div className="flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

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
          <label htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              className="input !pr-11"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button
              type="button"
              className="absolute top-1/2 right-1.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
            </button>
          </div>
          {isSignUp && <span className="hint">At least 8 characters.</span>}
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full !py-3" disabled={pending}>
          {pending ? "One moment…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

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
