import crypto from "crypto";

function secret() {
  return process.env.WAZZUP_API_KEY || process.env.SESSION_SECRET || "wazzup-media";
}

export function signMediaKey(key: string) {
  return crypto.createHmac("sha256", secret()).update(key).digest("hex").slice(0, 32);
}

export function verifyMediaKey(key: string, sig: string) {
  const expected = signMediaKey(key);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export function publicMediaUrl(storageKey: string) {
  const app = (process.env.APP_URL || "").replace(/\/$/, "");
  const sig = signMediaKey(storageKey);
  return `${app}/api/public/files?key=${encodeURIComponent(storageKey)}&sig=${sig}`;
}
