const COOKIE_NAME = "kern_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return value;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return toHex(signature);
}

export async function createSessionToken() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expires}`;
  return `${payload}.${await sign(payload)}`;
}

export async function isValidSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresRaw, signature] = parts;
  if (role !== "admin") return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const payload = `${role}.${expiresRaw}`;
  try {
    const expected = await sign(payload);
    return safeEqual(signature, expected);
  } catch {
    return false;
  }
}

function normalizeSecret(value: string) {
  let next = value.trim().replace(/^\uFEFF/, "");
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1);
  }
  if (next.startsWith("ADMIN_PASSWORD=")) {
    next = next.slice("ADMIN_PASSWORD=".length);
  }
  return next;
}

export function verifyAdminPassword(password: string) {
  const expected = normalizeSecret(process.env.ADMIN_PASSWORD ?? "");
  const given = normalizeSecret(password);
  if (!expected || !given) return false;
  return safeEqual(given, expected);
}

export async function setAdminCookie() {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set(COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminCookie() {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated() {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return isValidSessionToken(store.get(COOKIE_NAME)?.value);
}
