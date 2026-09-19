import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canDownloadRecordings, canListenAllRecordings, scopeManagerId } from "@/lib/rbac";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const download = req.nextUrl.searchParams.get("download") === "1";
    const call = await prisma.call.findUnique({ where: { id }, include: { recordings: true } });
    if (!call?.recordingUrl && !call?.recordings[0]) {
      return NextResponse.json({ error: "NO_RECORDING" }, { status: 404 });
    }
    const allowed =
      canListenAllRecordings(user.role) || (!scopeManagerId(user.role, user.id) ? true : call.managerId === user.id);
    if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (download && !canDownloadRecordings(user.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const url = call.recordingUrl || call.recordings[0]?.url;
    return NextResponse.json({ url, download });
  } catch (err) {
    return jsonError(err);
  }
}
