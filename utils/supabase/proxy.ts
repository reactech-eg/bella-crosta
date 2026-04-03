import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth-constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const createClient = async (request: NextRequest) => {
  let response = NextResponse.next();

  const { pathname } = request.nextUrl;

  // ── Get token ───────────────────────────────────────────────
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value ??
    null;

  let userId: string | null = null;
  let isAdmin = false;

  // ── Create Supabase client (SAFE) ───────────────────────────
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // ── Get user ───────────────────────────────────────────────
  if (token) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        userId = user.id;

        // check admin
        const { data } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        isAdmin = !!data;
      }
    } catch {
      // ignore errors
    }
  }

  const isLoggedIn = !!userId;

  // ── Routes ───────────────────────────────────────────────
  const GUEST_ONLY_ROUTES = ["/auth/login", "/auth/signup"];
  const ADMIN_ROUTES = ["/admin/dashboard" , "/admin/orders" , "/admin/payments" , "/admin/inventory" , "/admin/customers" , "/admin"];
  const PROTECTED_ROUTES = ["/checkout", "/order", "/my-orders"];

  // ── Safe redirect helper ───────────────────────────────────
  const safeRedirect = (to: string) => {
    if (pathname === to) return response; // ❌ يمنع loop
    return NextResponse.redirect(new URL(to, request.url));
  };

  // ── Guest صفحات ───────────────────────────────────────────
  if (GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isLoggedIn) {
      return safeRedirect(isAdmin ? "/admin/dashboard" : "/");
    }
    return response;
  }

  // ── Admin pages ───────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return safeRedirect("/auth/login");
    }

    if (!isAdmin) {
      return safeRedirect("/");
    }

    return response;
  }

  // ── Home redirect admin ───────────────────────────────────
  if (pathname === "/" && isAdmin) {
    return safeRedirect("/admin/dashboard");
  }

  // ── Protected pages ───────────────────────────────────────
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
};