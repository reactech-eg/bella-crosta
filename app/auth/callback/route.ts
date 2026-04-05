import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback, verifyEmailToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  // Try to parse OAuth parameters
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  // Try to parse Email OTP parameters
  const token_hash = searchParams.get("token_hash");
  const type_str = searchParams.get("type");
  
  const next = searchParams.get("next") ?? "/";

  // 1. Handle OAuth Errors
  if (error) {
    const errorDesc = searchParams.get("error_description") ?? "OAuth login failed.";
    console.error("[auth callback] error:", errorDesc);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDesc)}`, request.url)
    );
  }

  // 2. Handle Email Confirmation Flow (OTP)
  if (token_hash && type_str) {
    const type = type_str as import("@supabase/supabase-js").EmailOtpType;
    const result = await verifyEmailToken(token_hash, type);
    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }
    // Redirect based on role
    const destination =
      result.role === "admin" ? "/admin/dashboard" : next.startsWith("/admin") ? "/" : next;

    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 3. Handle OAuth Follow-up Flow (Code Exchange)
  if (code) {
    const result = await handleOAuthCallback(code);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    // Redirect based on role
    const destination =
      result.role === "admin" ? "/admin/dashboard" : next.startsWith("/admin") ? "/" : next;

    return NextResponse.redirect(new URL(destination, request.url));
  }

  // If no params match, return to login with error
  return NextResponse.redirect(new URL("/auth/login?error=Invalid+auth+link", request.url));
}
