"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/rbac";

type User = { id: string; name: string; email: string; role: Role };
const AccessContext = createContext<{ user: User | null; readOnly: boolean }>({ user: null, readOnly: true });

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (["/login", "/forgot-password", "/reset-password", "/go"].includes(pathname) || pathname.startsWith("/w/")) {
      setUser(null);
      return;
    }
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async response => response.ok ? await response.json() as User : null)
      .then(value => { if (!cancelled) setUser(value); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, [pathname]);
  return <AccessContext.Provider value={{ user, readOnly: !user || user.role === "OBSERVER" }}>{children}</AccessContext.Provider>;
}

export function useAccess() { return useContext(AccessContext); }

export function WriteAccess({ children }: { children: React.ReactNode }) {
  const { readOnly } = useAccess();
  return readOnly ? null : children;
}
