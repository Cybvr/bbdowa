"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  inMemoryPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
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

export function LoginForm({
  initialMode = "signin",
  isModal = false,
  onSuccess,
  redirectTo = "/dashboard",
  className,
}: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<LoginFormMode>(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [craft, setCraft] = React.useState("");
  const [portfolio, setPortfolio] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
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
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "That email and password combination is not valid.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes, then try again.";
      case "auth/network-request-failed":
        return "Firebase could not be reached. Check your connection and try again.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was closed before it finished.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase Authentication.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled in Firebase Authentication.";
      default:
        return "Firebase could not complete the sign-in. Please try again.";
    }
  };

  const createServerSession = async (user: User) => {
    const idToken = await user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, rememberMe }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "The server could not start your session.");
    }

    await signOut(firebaseAuth);
    setSuccessMessage("Welcome back. Opening Bantaba...");
    onSuccess?.();
    router.replace(destination);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signin") {
      if (!email.trim() || !password.trim()) {
        setError("Please enter both your email address and password.");
        return;
      }

      setIsLoading(true);
      try {
        await setPersistence(firebaseAuth, inMemoryPersistence);
        const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        await createServerSession(credential.user);
      } catch (authError) {
        setError(authErrorMessage(authError));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!fullName.trim() || !email.trim()) {
        setError("Please fill in your name and email address.");
        return;
      }

      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 900));

      setIsLoading(false);
      setSuccessMessage("Application received! We'll review your portfolio and send you an invite.");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);
      const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      await createServerSession(credential.user);
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Enter your email address first, then request a reset link.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setSuccessMessage("Password reset email sent. Check your inbox.");
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
        <img
          src="/bbdo-west-africa.png"
          alt="BBDO West Africa"
          className="mb-5 h-8 w-auto object-contain dark:invert"
        />
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {mode === "signin" ? "Welcome back" : "Join the Bantaba"}
        </h2>
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to access your briefs, creators directory, and campaign collaborations."
            : "Connect with West Africa's leading brands, agencies, and creative opportunities."}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-xs font-bold sm:text-sm">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
            setSuccessMessage(null);
          }}
          className={cn(
            "rounded-lg py-2.5 transition-all",
            mode === "signin"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setSuccessMessage(null);
          }}
          className={cn(
            "rounded-lg py-2.5 transition-all",
            mode === "signup"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Apply as Creator
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div aria-live="polite" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label htmlFor="auth-fullname" className="mb-1.5 block text-xs font-bold text-foreground">
                Full Name <span className="text-primary">*</span>
              </label>
              <Input
                id="auth-fullname"
                type="text"
                placeholder="e.g. Amina Bello"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 rounded-xl bg-background text-sm"
              />
            </div>

            <div>
              <label htmlFor="auth-craft" className="mb-1.5 block text-xs font-bold text-foreground">
                Primary Craft / Specialization
              </label>
              <Input
                id="auth-craft"
                type="text"
                placeholder="e.g. Art Director, Film Producer, 3D Artist"
                value={craft}
                onChange={(e) => setCraft(e.target.value)}
                className="h-11 rounded-xl bg-background text-sm"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-xs font-bold text-foreground">
            Work or Creator Email <span className="text-primary">*</span>
          </label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 rounded-xl bg-background text-sm"
          />
        </div>

        {mode === "signin" ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="auth-password" className="text-xs font-bold text-foreground">
                Password <span className="text-primary">*</span>
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isLoading}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl bg-background pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="auth-portfolio" className="mb-1.5 block text-xs font-bold text-foreground">
              Portfolio / Website / Behance
            </label>
            <Input
              id="auth-portfolio"
              type="url"
              placeholder="https://behance.net/yourprofile"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              className="h-11 rounded-xl bg-background text-sm"
            />
          </div>
        )}

        {mode === "signin" && (
          <div className="flex items-center gap-2 pt-1">
            <input
              id="auth-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <label htmlFor="auth-remember" className="text-xs text-muted-foreground select-none cursor-pointer">
              Remember this device for 30 days
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{mode === "signin" ? "Authenticating..." : "Submitting..."}</span>
            </>
          ) : (
            <>
              <span>{mode === "signin" ? "Sign in to Bantaba" : "Submit Creator Application"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Alternative SSO Providers */}
      <div className="mt-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative bg-background px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Or continue with
          </span>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.09C3.26 21.43 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.41l4.04-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.57 1.24 6.59l4.04 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>
      </div>

      {/* Footer info / Terms */}
      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
        By continuing, you agree to BBDO West Africa&apos;s{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
