"use server";

import { redirect } from "next/navigation";
import type { UserRole, SessionUser, AuthResult } from "@/lib/types";
import { createClient as serverClient } from "@/utils/supabase/server";
import { createAdminClient as adminClient } from "@/utils/supabase/admin-client";

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  try {
    const supabase = await serverClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // store full_name in metadata as a fallback
      },
    });

    if (error) return { success: false, error: error.message };
    if (!data.user)
      return {
        success: false,
        error: "Account creation failed. Please try again.",
      };

    // We no longer manually insert into customers here, a DB trigger will handle it.
    // If the session exists, the email confirmation is likely off, so we set cookie and log in.
    if (data.session) {
      return { success: true, redirectTo: "/" };
    }

    // If no session, it means email confirmation is required by Supabase.
    return { success: true, emailSent: true, email: data.user.email ?? email };
  } catch (_e) {
    console.error("[auth] signUp unexpected error:", _e);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const supabase = await serverClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };
    if (!data.session)
      return { success: false, error: "Login failed. Please try again." };

    const role = await _getUserRole(data.user.id);
    return {
      success: true,
      redirectTo: role === "admin" ? "/admin/dashboard" : "/",
    };
  } catch (e) {
    console.error("[auth] signIn unexpected error:", e);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Verify Email Token ───────────────────────────────────────────────────────
// Called from /auth/callback when type=email
export async function verifyEmailToken(
  tokenHash: string,
  type: import("@supabase/supabase-js").EmailOtpType,
): Promise<
  { success: true; role: UserRole } | { success: false; error: string }
> {
  try {
    const supabase = await serverClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error || !data.session || !data.user)
      return {
        success: false,
        error: error?.message ?? "Email verification failed or expired link.",
      };

    // the trigger handles creating customer profile so we just fetch role
    const role = await _getUserRole(data.user.id);
    return { success: true, role };
  } catch (_e) {
    console.error("[auth] verifyEmailToken error:", _e);
    return { success: false, error: "Email verification failed." };
  }
}

// ─── Get current user ────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const supabase = await serverClient();

    // First try the built-in SSR cookie method (which handles automatic token refresh)
    const ssrResult = await supabase.auth.getUser();
    const user = ssrResult.data.user;
    if (!user) {
      return null; // No user, no need to check further
    }

    const role = await _getUserRole(user.id);
    return { id: user.id, email: user.email!, role };
  } catch (e: unknown) {
    // DYNAMIC_SERVER_USAGE is an expected Next.js error during static generation — not a real error
    const isDynamicServerError =
      e instanceof Error &&
      (e as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";

    if (!isDynamicServerError) {
      console.error("[auth] getCurrentUser error:", e);
    }
    return null;
  }
}

// ─── Guards ───────────────────────────────────────────────────────────────────

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin") redirect("/");
  return user;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function _getUserRole(userId: string): Promise<UserRole> {
  try {
    const supabase = adminClient();
    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    return data ? "admin" : "customer";
  } catch (e) {
    console.error("[auth] _getUserRole error:", e);
    return "customer";
  }
}
