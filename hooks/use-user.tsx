"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "@/lib/auth";
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
  initialUser = null 
}: { 
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(false);

  // Sync state when initialUser changes from a server re-render (e.g. router.refresh())
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const supabase = createClient();

    // Initial load fetch if not provided
    if (initialUser === undefined) {
      setLoading(true);
      getCurrentUser()
        .then((u) => setUser(u))
        .finally(() => setLoading(false));
    }

    // Subscribe to future auth state changes (token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setLoading(true);
        try {
          const u = await getCurrentUser();
          setUser(u);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser]);

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
