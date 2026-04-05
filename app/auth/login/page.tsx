"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

// Google icon SVG
// function GoogleIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
//       <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
//       <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
//       <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
//     </svg>
//   )
// }

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || null;
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(oauthError ?? "");
  const [isPending, startTransition] = useTransition();
  // const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const dest =
        returnUrl && !returnUrl.startsWith("/admin")
          ? returnUrl
          : (result as { redirectTo: string }).redirectTo;
      router.push(dest);
      router.refresh();
    });
  };

  // const handleGoogle = async () => {
  //   setGoogleLoading(true)
  //   setError('')
  //   const result = await getGoogleAuthUrl(returnUrl ?? undefined)
  //   if (!result.success) {
  //     setError(result.error)
  //     setGoogleLoading(false)
  //     return
  //   }
  //   window.location.href = result.url
  // }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your Bella Crosta account
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth */}
        {/* <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || isPending}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button> */}

        {/* Divider */}
        {/* <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-card text-xs text-muted-foreground">or sign in with email</span>
          </div>
        </div> */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isPending
              //  || googleLoading
            }
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-accent text-primary-foreground font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-card text-xs text-muted-foreground">
              Don&apos;t have an account?
            </span>
          </div>
        </div>

        <Link
          href="/auth/signup"
          className="w-full flex items-center justify-center py-2.5 px-6 rounded-xl border border-border text-foreground hover:bg-secondary text-sm font-medium transition-all duration-200"
        >
          Create an account
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Restaurant staff?{" "}
        <span className="text-primary">
          Sign in with your admin credentials to access the dashboard.
        </span>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-4 w-64 bg-muted rounded mb-8" />
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded-xl" />
            <div className="h-10 bg-muted rounded-xl" />
            <div className="h-12 bg-primary/20 rounded-xl mt-2" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
