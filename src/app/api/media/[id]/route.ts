import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canSeeAllRecords } from "@/lib/rbac";
import { getObject } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const message = await prisma.message.findUnique({
      where: { id },
      include: { contact: { select: { managerId: true } } },
    });
    if (!message?.mediaUrl) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canSeeAllRecords(user.role) && message.contact.managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const object = await getObject(message.mediaUrl);
    if (!object) return NextResponse.json({ error: "STORAGE_UNAVAILABLE" }, { status: 503 });
    return new NextResponse(new Uint8Array(object.body), {
      headers: {
        "Content-Type": object.contentType || message.mediaMimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${message.mediaFileName || id}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
