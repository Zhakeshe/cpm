import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isManagerBlockedPath } from "./lib/pipeline-defaults";

const PUBLIC = ["/login", "/forgot-password", "/reset-password", "/go", "/w"];
const WEBHOOKS = ["/api/webhooks/", "/api/health"];
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isWebhookOrHealth(pathname: string) {
  return WEBHOOKS.some((p) => pathname.startsWith(p));
}

/**
 * Session cookies are SameSite=Lax, so cross-site form posts are already blocked;
 * this adds an explicit origin check for JSON mutations from other origins.
 */
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const allowed = new Set<string>();
    const host = req.headers.get("host");
    if (host) {
      allowed.add(`http://${host}`);
      allowed.add(`https://${host}`);
    }
    if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    isWebhookOrHealth(pathname)
  ) {
    return NextResponse.next();
  }

  if (UNSAFE_METHODS.has(req.method) && !sameOrigin(req)) {
    return NextResponse.json({ error: "CROSS_ORIGIN_BLOCKED" }, { status: 403 });
  }

  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/forgot") ||
    pathname.startsWith("/api/auth/reset") ||
    pathname.startsWith("/api/public/")
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
    const { payload } = await jwtVerify(token, secret);
    if (isPublic && pathname !== "/go" && !pathname.startsWith("/w")) return NextResponse.redirect(new URL("/", req.url));
    const role = String(payload.role || "");
    if (role !== "ADMIN" && role !== "SUPERVISOR" && isManagerBlockedPath(pathname)) {
      return NextResponse.redirect(new URL("/leads", req.url));
    }
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
