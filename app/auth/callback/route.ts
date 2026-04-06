import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Parse Email OTP parameters
  const token_hash = searchParams.get("token_hash");
  const type_str = searchParams.get("type");

  const next = searchParams.get("next") ?? "/";

  // Handle Email Confirmation Flow (OTP)
  if (token_hash && type_str) {
    const type = type_str as import("@supabase/supabase-js").EmailOtpType;
    const result = await verifyEmailToken(token_hash, type);
    if (!result.success) {
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent(result.error)}`,
          request.url,
        ),
      );
    }
    // Redirect based on role
    const destination =
      result.role === "admin"
        ? "/admin/dashboard"
        : next.startsWith("/admin")
          ? "/"
          : next;

    return NextResponse.redirect(new URL(destination, request.url));
  }

  // If no params match, return to login with error
  return NextResponse.redirect(
    new URL("/auth/login?error=Invalid+auth+link", request.url),
  );
}
