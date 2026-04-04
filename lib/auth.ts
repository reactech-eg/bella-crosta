"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./auth-constants";
import type { UserRole, SessionUser, AuthResult } from "@/lib/types";
import { createClient as serverClient } from "@/utils/supabase/server";
import { createAdminClient as adminClient } from "@/utils/supabase/admin-client";
import { clearSession } from "@/utils/supabase/server";

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  try {
    const sb = await serverClient();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.user)
      return { success: false, error: "Account creation failed. Please try again." };

    const { error: profileErr } = await sb
      .from("customers")
      .insert({ id: data.user.id, email, full_name: fullName });
    if (profileErr) console.error("[auth] customers insert error:", profileErr.message);

    if (data.session) await _setCookie(data.session.access_token);

    return { success: true, redirectTo: "/" };
  } catch (e) {
    console.error("[auth] signUp unexpected error:", e);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const sb = await serverClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.session) return { success: false, error: "Login failed. Please try again." };

    await _setCookie(data.session.access_token);

    const role = await _getUserRole(data.user.id);
    return { success: true, redirectTo: role === "admin" ? "/admin/dashboard" : "/" };
  } catch (e) {
    console.error("[auth] signIn unexpected error:", e);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Google OAuth — get redirect URL ─────────────────────────────────────────
// Call this server action to initiate Google OAuth.
// Returns the URL the client should navigate to.
export async function getGoogleAuthUrl(
  redirectTo?: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const sb = await serverClient();
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error || !data.url)
      return { success: false, error: error?.message ?? "Failed to get Google auth URL." };

    return { success: true, url: data.url };
  } catch (e) {
    console.error("[auth] getGoogleAuthUrl error:", e);
    return { success: false, error: "Something went wrong." };
  }
}

// ─── Handle OAuth Callback ────────────────────────────────────────────────────
// Called from /auth/callback route after Google redirects back.
export async function handleOAuthCallback(
  code: string,
): Promise<{ success: true; role: UserRole } | { success: false; error: string }> {
  try {
    const sb = await serverClient();
    const { data, error } = await sb.auth.exchangeCodeForSession(code);

    if (error || !data.session)
      return { success: false, error: error?.message ?? "OAuth callback failed." };

    await _setCookie(data.session.access_token);

    // Ensure customer profile exists for OAuth users
    const user = data.user;
    const { data: existingProfile } = await sb
      .from("customers")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      const fullName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "User";

      await sb.from("customers").insert({
        id: user.id,
        email: user.email ?? "",
        full_name: fullName,
      });
    }

    const role = await _getUserRole(user.id);
    return { success: true, role };
  } catch (e) {
    console.error("[auth] handleOAuthCallback error:", e);
    return { success: false, error: "OAuth callback failed." };
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  try {
    const token = await getSessionToken();
    if (token) {
      const supabase = await serverClient();
      await supabase.auth.signOut();
    }
  } catch (e) {
    console.error("[auth] signOut — Supabase invalidation failed (non-fatal):", e);
  }

  try {
    await clearSession();
  } catch (e) {
    console.error("[auth] signOut — cookie deletion failed:", e);
  }

  redirect("/");
}

// ─── Get session token ────────────────────────────────────────────────────────

export async function getSessionToken(): Promise<string | null> {
  try {
    const jar = await cookies();
    return jar.get(SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

// ─── Get current user ────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const token = await getSessionToken();
    if (!token) return null;

    const sb = await serverClient();
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return null;

    const role = await _getUserRole(user.id);
    return { id: user.id, email: user.email!, role };
  } catch (e) {
    console.error("[auth] getCurrentUser error:", e);
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
    const sb = adminClient();
    const { data } = await sb
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

async function _setCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}