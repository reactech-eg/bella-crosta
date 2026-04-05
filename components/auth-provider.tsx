"use client";

import React from "react";
import { UserProvider } from "@/hooks/use-user";
import type { SessionUser } from "@/lib/types";

export function AuthProvider({ 
  children,
  initialUser = null
}: { 
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  return <UserProvider initialUser={initialUser}>{children}</UserProvider>;
}
