"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  OAuthProvider,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { firebaseAuth } from "@/lib/firebase/client";

export type LoginFormMode = "signin" | "signup";

export interface LoginFormProps {
  initialMode?: LoginFormMode;
  isModal?: boolean;
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.09C3.26 21.43 7.33 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.41l4.04-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.57 1.24 6.59l4.04 3.09c.95-2.83 3.6-4.93 6.72-4.93z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <span className="grid h-4 w-4 grid-cols-2 gap-[2px]" aria-hidden="true">
      <span className="bg-[#f35325]" />
      <span className="bg-[#81bc06]" />
      <span className="bg-[#05a6f0]" />
      <span className="bg-[#ffba08]" />
    </span>
  );
}

export function LoginForm({
  initialMode = "signin",
  onSuccess,
  redirectTo = "/dashboard",
  className,
}: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<LoginFormMode>(initialMode);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const destination =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  const authErrorMessage = (authError: unknown) => {
    if (!(authError instanceof FirebaseError)) {
      return authError instanceof Error ? authError.message : "We could not sign you in. Please try again.";
    }

    switch (authError.code) {
      case "auth/popup-closed-by-user":
        return "The sign-in window was closed before it finished.";
      case "auth/popup-blocked":
        return "Your browser blocked the sign-in window. Allow pop-ups and try again.";
      case "auth/account-exists-with-different-credential":
        return "This account already uses a different sign-in provider.";
      case "auth/network-request-failed":
        return "Firebase could not be reached. Check your connection and try again.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase Authentication.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled in Firebase Authentication yet.";
      default:
        return "Firebase could not complete the sign-in. Please try again.";
    }
  };

  const createServerSession = async (user: User, intent: "member" | "creator") => {
    const idToken = await user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, rememberMe, intent }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "The server could not start your session.");
    }

    const data = (await response.json()) as { needsOnboarding?: boolean };
    await signOut(firebaseAuth);
    const needsOnboarding = intent === "creator" && data.needsOnboarding;
    setSuccessMessage(needsOnboarding ? "Account created. Opening your creator setup..." : "Welcome back. Opening Bantaba...");
    onSuccess?.();
    router.replace(needsOnboarding ? "/onboarding/creator" : destination);
    router.refresh();
  };

  const handleSocialSignIn = async (provider: "google" | "microsoft") => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);
      const authProvider = provider === "google"
        ? new GoogleAuthProvider()
        : new OAuthProvider("microsoft.com");
      authProvider.setCustomParameters({ prompt: "select_account" });
      if (provider === "microsoft") authProvider.addScope("User.Read");
      const credential = await signInWithPopup(firebaseAuth, authProvider);
      await createServerSession(credential.user, mode === "signup" ? "creator" : "member");
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-6 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bbdo-west-africa.png" alt="BBDO West Africa" className="mb-5 h-8 w-auto object-contain dark:invert" />
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {mode === "signin" ? "Welcome back" : "Create your creator profile"}
        </h2>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground sm:text-sm">
          {mode === "signin"
            ? "Sign in with Google or Microsoft to access Bantaba."
            : "Start with Google or Microsoft, then complete your creator onboarding."}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-xs font-bold sm:text-sm">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
            setSuccessMessage(null);
          }}
          className={cn("rounded-lg py-2.5 transition-all", mode === "signin" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setSuccessMessage(null);
          }}
          className={cn("rounded-lg py-2.5 transition-all", mode === "signup" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
        >
          Start as a creator
        </button>
      </div>

      {successMessage ? (
        <div aria-live="polite" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      ) : null}

      {error ? <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">{error}</div> : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleSocialSignIn("google")}
          disabled={isLoading}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
          <span>Continue with Google</span>
          <ArrowRight className="ml-auto h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleSocialSignIn("microsoft")}
          disabled={isLoading}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicrosoftMark />}
          <span>Continue with Microsoft</span>
          <ArrowRight className="ml-auto h-4 w-4" />
        </button>
      </div>

      {mode === "signin" ? (
        <label className="mt-5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />
          Remember this device for 14 days
        </label>
      ) : (
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">New creators complete their profile, craft and portfolio details after social sign-in.</p>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
        By continuing, you agree to BBDO West Africa&apos;s{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link>{" "}
        and{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
      </p>
    </div>
  );
}
