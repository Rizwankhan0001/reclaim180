"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
      {error}
    </p>
  );
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="card mx-auto grid w-full max-w-[440px] gap-5 !p-8 shadow-lift">
      <div>
        <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em]">{title}</h1>
        <p className="mt-1 text-sm text-muted">{sub}</p>
      </div>
      {children}
    </div>
  );
}

const BackToSignIn = () => (
  <p className="text-center text-sm text-muted">
    <Link href="/sign-in" className="inline-block py-1.5 font-semibold text-accent">
      Back to sign in
    </Link>
  </p>
);

/** Step 1: ask for the email. The answer is the same whether or not an account exists, so it can't be used to find out who has one. */
export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setPending(true);
    const res = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    if (res.error) {
      return setError(
        res.error.status === 429
          ? "Too many requests in a short time. Wait a minute, then try again."
          : "Couldn't send the email right now. Try again in a few minutes.",
      );
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <Card title="Check your email" sub="The link works for 1 hour.">
        <p className="rounded-xl bg-surface-2 p-3.5 text-[14px] [overflow-wrap:anywhere]">
          If there&apos;s an account for <b>{sentTo}</b>, we&apos;ve sent it a link to choose a new password. It can take a minute
          to arrive. Check your spam folder too.
        </p>
        <button type="button" className="btn w-full" onClick={() => setSentTo(null)}>
          Use a different email
        </button>
        <BackToSignIn />
      </Card>
    );
  }

  return (
    <Card title="Forgot your password?" sub="Enter your email and we'll send you a link to choose a new one.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <ErrorText error={error} />
        <button type="submit" className="btn btn-primary w-full !py-3" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <BackToSignIn />
    </Card>
  );
}

/** Step 2: the link from the email lands here with ?token=… (or ?error=INVALID_TOKEN when it's expired or used). */
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!token || params.get("error")) {
    return (
      <Card title="This link has expired" sub="Reset links work once, for 1 hour.">
        <Link href="/forgot-password" className="btn btn-primary w-full !py-3">
          Send a new link
        </Link>
        <BackToSignIn />
      </Card>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const newPassword = String(f.get("password") ?? "");
    if (newPassword.length < 8) return setError("Use at least 8 characters.");
    if (newPassword !== String(f.get("confirm") ?? "")) return setError("The two passwords don't match.");
    setPending(true);
    const res = await authClient.resetPassword({ newPassword, token: token! });
    setPending(false);
    if (res.error) {
      return setError(
        res.error.code === "INVALID_TOKEN"
          ? "This link has expired or was already used. Ask for a new one."
          : res.error.message || "Couldn't change your password. Try again.",
      );
    }
    router.replace("/sign-in?reset=1");
  }

  return (
    <Card title="Choose a new password" sub="You'll be signed out on all your devices, then you can sign in with the new one.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="field">
          <label htmlFor="password">New password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              className="input !pr-12"
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
          <span className="hint">At least 8 characters.</span>
        </div>
        <div className="field">
          <label htmlFor="confirm">Type it again</label>
          <input id="confirm" name="confirm" type={showPw ? "text" : "password"} required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <ErrorText error={error} />
        <button type="submit" className="btn btn-primary w-full !py-3" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </button>
      </form>
    </Card>
  );
}

/** On the sign-in page after a successful reset. */
export function ResetNotice() {
  if (useSearchParams().get("reset") !== "1") return null;
  return (
    <p role="status" className="rounded-lg bg-good/10 px-3 py-2 text-sm font-medium text-good">
      Your password is changed. Sign in with your new one.
    </p>
  );
}
