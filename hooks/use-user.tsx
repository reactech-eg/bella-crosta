"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { SessionUser } from "@/lib/types";

interface UserContextValue {
  user: SessionUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
});

export function UserProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  // Start loading only if we don't have an initialUser from the server
  const [loading, setLoading] = useState(initialUser === null);

  // Sync state when initialUser changes from a server re-render (e.g. router.refresh())
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange fires INITIAL_SESSION on mount.
    // We rely on the session passed directly to the callback — no extra getSession() call needed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser((prev) => ({
          id: session.user.id,
          email: session.user.email!,
          // Preserve the role from the server-provided initialUser if available,
          // otherwise default to "customer" (role is a server-side concern)
          role: prev?.id === session.user.id ? prev.role : "customer",
        }));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

/** Use this instead of useAuthStore in any Client Component */
export function useUser(): UserContextValue {
  return useContext(UserContext);
}
