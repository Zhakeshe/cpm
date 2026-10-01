"use client";

import { usePathname } from "next/navigation";
import { Softphone } from "@/components/Softphone";

/** Keep active calls mounted across CRM pages, remove the phone on public/login routes. */
export function PhoneHost() {
  const pathname = usePathname();
  const publicPaths = ["/login", "/forgot-password", "/reset-password", "/go", "/w"];
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;
  return <Softphone />;
}
