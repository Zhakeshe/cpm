import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true });
    redis.on("error", (err) => {
      console.error("redis_error", err.message);
    });
  }
  return redis;
}
