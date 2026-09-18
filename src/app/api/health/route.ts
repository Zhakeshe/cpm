import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export async function GET() {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }
  let redis = "disabled";
  try {
    const r = getRedis();
    if (r) {
      await r.ping();
      redis = "ok";
    }
  } catch {
    redis = "error";
  }
  const ok = db === "ok";
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", db, redis, uptime: process.uptime() },
    { status: ok ? 200 : 503 },
  );
}
