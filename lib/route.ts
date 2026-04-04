import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    const errorDesc = searchParams.get("error_description") ?? "OAuth login failed.";
    console.error("[OAuth callback] error:", errorDesc);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDesc)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=No+auth+code", request.url));
  }

  const result = await handleOAuthCallback(code);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(result.error)}`, request.url),
    );
  }

  // Redirect based on role
  const destination =
    result.role === "admin" ? "/admin/dashboard" : next.startsWith("/admin") ? "/" : next;

  return NextResponse.redirect(new URL(destination, request.url));
}