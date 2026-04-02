"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, setUser, clearUser } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch of the session securely from the server
    fetchUser();

    // Setup listener for auth state changes (e.g. across tabs)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        clearUser();
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // We re-query our server action to fetch role & details securely
        // instead of trusting raw localStorage session object blindly
        const user = await getCurrentUser();
        setUser(user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser, setUser, clearUser, supabase.auth]);

  return <>{children}</>;
}
