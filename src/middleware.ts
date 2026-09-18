import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = ["/login", "/forgot-password", "/reset-password"];
const WEBHOOKS = ["/api/webhooks/", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    WEBHOOKS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/forgot") ||
    pathname.startsWith("/api/auth/reset")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("crm_session")?.value;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p));
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me-please-32chars!!");
    await jwtVerify(token, secret);
    if (isPublic) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
