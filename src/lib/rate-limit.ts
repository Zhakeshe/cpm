import { getRedis } from "./redis";

type Result = { ok: boolean; remaining: number; retryAfter: number };

const memory = new Map<string, { count: number; expiresAt: number }>();

function memoryLimit(key: string, limit: number, windowSec: number): Result {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.expiresAt <= now) {
    memory.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  entry.count += 1;
  const ok = entry.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: ok ? 0 : Math.ceil((entry.expiresAt - now) / 1000),
  };
}

/**
 * Counter lives in Redis so the limit holds across app instances; a per-process
 * map keeps local development and Redis outages working.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<Result> {
  const redis = getRedis();
  if (!redis) return memoryLimit(key, limit, windowSec);
  try {
    const redisKey = `ratelimit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSec);
    const ttl = await redis.ttl(redisKey);
    const ok = count <= limit;
    return { ok, remaining: Math.max(0, limit - count), retryAfter: ok ? 0 : Math.max(ttl, 1) };
  } catch {
    return memoryLimit(key, limit, windowSec);
  }
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export function tooManyRequests(retryAfter: number) {
  return new Response(JSON.stringify({ error: "RATE_LIMIT" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter || 60) },
  });
}
