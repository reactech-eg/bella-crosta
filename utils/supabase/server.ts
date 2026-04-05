import { getAuthCookiesToClear, SESSION_COOKIE } from "@/lib/auth-constants";
import { SessionUser } from "@/lib/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

export async function setSession(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSession() {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";

  for (const name of getAuthCookiesToClear()) {
    jar.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    jar.delete(name);
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const sb = await createClient();
  let { data: { user } } = await sb.auth.getUser();

  if (!user) {
    const token = await getSessionToken();
    if (!token) return null;
    const result = await sb.auth.getUser(token);
    user = result.data.user;
    if (!user) return null;
  }

  // Check admin users table since user.role returned by supabase is just the auth role ("authenticated")
  const { createAdminClient } = await import("@/utils/supabase/admin-client");
  const adminDb = createAdminClient();
  const { data: adminUser } = await adminDb
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email!,
    role: adminUser ? "admin" : "customer",
  };
}
