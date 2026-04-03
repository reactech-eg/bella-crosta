import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth-constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;



export const createClient = async (request: NextRequest) => {
  // Create an unmodified response
  const supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  //   const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
  //     cookies: {
  //       getAll() {
  //         return request.cookies.getAll();
  //       },
  //       setAll(cookiesToSet) {
  //         cookiesToSet.forEach(({ name, value, options }) =>
  //           request.cookies.set(name, value),
  //         );
  //         supabaseResponse = NextResponse.next({
  //           request,
  //         });
  //         cookiesToSet.forEach(({ name, value, options }) =>
  //           supabaseResponse.cookies.set(name, value, options),
  //         );
  //       },
  //     },
  //   });

  // ── Resolve user identity ─────────────────────────────────────────────────
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value ??
    null;

  let userId: string | null = null;
  let isAdmin = false;

  if (token) {
    try {
      // Use service role client for role checking to bypass RLS in middleware
      const adminClient = createServerClient(
        supabaseUrl!,
        (supabaseRoleKey || supabaseKey)!,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: () => {},
          },
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );

      const {
        data: { user },
      } = await adminClient.auth.getUser(token);

      if (user) {
        userId = user.id;

        // Check admin status
        const { data: adminRow } = await adminClient
          .from("admin_users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        isAdmin = !!adminRow;
      }
    } catch {
      // Invalid token — treat as logged out
    }
  }

  const isLoggedIn = !!userId;

  // Route categories
  const GUEST_ONLY_ROUTES = ["/auth/login", "/auth/signup"];
  const ADMIN_ROUTES = ["/admin/dashboard" , "/admin/orders" , "/admin/payments" , "/admin/inventory" , "/admin/customers" , "/admin"];
  const PROTECTED_ROUTES = ["/checkout", "/order", "/my-orders"];

  /**
   * Redirect with no-store cache control headers
   */
  function redirectNoStore(url: URL | string) {
    const response = NextResponse.redirect(url);
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // ── Guest-only routes — redirect logged-in users ──────────────────────────
  if (GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isLoggedIn) {
      const dest = isAdmin ? "/admin/dashboard" : "/";
      return redirectNoStore(new URL(dest, request.url));
    }
    return supabaseResponse;
  }

  // ── Admin routes — require admin role ────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return redirectNoStore(new URL("/auth/login", request.url));
    }
    if (!isAdmin) {
      return redirectNoStore(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  // ── Home page — redirect admins to dashboard ──────────────────────────────
  if (pathname === "/" && isAdmin) {
    return redirectNoStore(new URL("/admin/dashboard", request.url));
  }

  // ── Protected customer routes — require login ────────────────────────────
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return redirectNoStore(loginUrl);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
};
