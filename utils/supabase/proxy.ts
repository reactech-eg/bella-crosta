import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const createClient = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  let userId: string | null = null;
  let isAdmin = false;

  // ── Create Supabase client (SAFE) ───────────────────────────
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // ── Get user ───────────────────────────────────────────────
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  const isLoggedIn = !!userId;

  // ── Routes ───────────────────────────────────────────────
  const GUEST_ONLY_ROUTES = ["/auth/login", "/auth/signup"];
  const ADMIN_ROUTES = ["/admin"];
  const PROTECTED_ROUTES = ["/checkout", "/order", "/orders", "/profile"];

  // ── Safe redirect helper ───────────────────────────────────
  const safeRedirect = (to: string) => {
    if (pathname === to) return supabaseResponse; // ❌ يمنع loop
    return NextResponse.redirect(new URL(to, request.url));
  };

  // ── Guest صفحات ───────────────────────────────────────────
  if (GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isLoggedIn) {
      return safeRedirect(isAdmin ? "/admin/dashboard" : "/");
    }
    return supabaseResponse;
  }

  // ── Admin pages ───────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return safeRedirect("/auth/login");
    }

    if (!isAdmin) {
      return safeRedirect("/");
    }

    return supabaseResponse;
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

  return supabaseResponse;
};
