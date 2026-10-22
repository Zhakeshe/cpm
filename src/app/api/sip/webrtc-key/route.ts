import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { zadarmaWebrtcKey } from "@/lib/zadarma";

export async function GET() {
  try {
    const user = await requireUser();
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { sipExtension: true, sipUsername: true },
    });
    const sip = account?.sipUsername || account?.sipExtension;
    if (!sip) {
      return NextResponse.json({ enabled: false, reason: "NO_EXTENSION" }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const key = await zadarmaWebrtcKey(sip);
    return NextResponse.json({ enabled: true, key, sip }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return jsonError(error);
  }
}
