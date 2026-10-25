import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireRole, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sipReasons } from "@/lib/sip-diagnostics";
import { z } from "zod";
const schema = z.object({ state: z.enum(["registering", "ready", "incoming", "connecting", "in-call", "disabled", "error"]), reason: z.enum(sipReasons), sipStatus: z.number().int().min(100).max(699).nullable().optional(), clientVersion: z.string().max(40).optional() });
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const value = { ...schema.parse(await req.json()), checkedAt: new Date().toISOString() };
    await prisma.systemSetting.upsert({ where: { key: `sip:status:${user.id}` }, create: { key: `sip:status:${user.id}`, value }, update: { value } });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return jsonError(e); }
}
export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);
    const users = await prisma.user.findMany({ where: { isActive: true, sipExtension: { not: null } }, select: { id: true, name: true, sipExtension: true } });
    const snapshots = await prisma.systemSetting.findMany({ where: { key: { in: users.map(u => `sip:status:${u.id}`) } } });
    return NextResponse.json(users.map(u => ({ ...u, diagnostic: snapshots.find(s => s.key === `sip:status:${u.id}`)?.value ?? null })), { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return jsonError(e); }
}
