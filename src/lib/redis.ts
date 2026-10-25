import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 2000, commandTimeout: 3000, enableOfflineQueue: false });
    redis.on("error", (err) => {
      console.error("redis_error", err.message);
    });
  }
  return redis;
}
