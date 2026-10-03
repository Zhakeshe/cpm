import { recordingReference } from "@/lib/recording-reference";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canDownloadRecordings, canListenAllRecordings } from "@/lib/rbac";
import { resolveRecordingUrl } from "@/lib/call-recording";
import { ZadarmaError } from "@/lib/zadarma";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const download = req.nextUrl.searchParams.get("download") === "1";
    const call = await prisma.call.findUnique({ where: { id }, include: { recordings: true } });
    if (!call) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    if (!canListenAllRecordings(user.role) && call.managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    if (download && !canDownloadRecordings(user.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const reference = recordingReference(call);
    if (!reference) return NextResponse.json({ error: "NO_RECORDING" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    const { url, provider } = await resolveRecordingUrl(reference);
    if (!provider) return new NextResponse(null, { status: 307, headers: { Location: url, "Cache-Control": "no-store" } });
    // Proxy short-lived provider links: the browser never receives their bearer token.
    const range = req.headers.get("range");
    const audio = await fetch(url, {
      headers: range ? { Range: range } : {}, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000),
    });
    if ((!audio.ok && audio.status !== 416) || !audio.body) throw new ZadarmaError("RECORDING_NOT_READY", 503);
    const headers = new Headers({ "Cache-Control": "private, no-store", "Content-Type": audio.headers.get("content-type") || "audio/mpeg" });
    for (const name of ["content-length", "content-range", "accept-ranges"]) {
      const value = audio.headers.get(name); if (value) headers.set(name, value);
    }
    if (download) headers.set("Content-Disposition", 'attachment; filename="call-recording.mp3"');
    return new NextResponse(audio.body, { status: audio.status, headers });
  } catch (error) {
    const response = error instanceof ZadarmaError
      ? NextResponse.json({ error: error.code }, { status: error.status })
      : jsonError(Object.assign(new Error("RECORDING_UNAVAILABLE"), { status: (error as { status?: number }).status || 502 }));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
