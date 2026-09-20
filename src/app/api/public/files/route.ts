import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/storage";
import { verifyMediaKey } from "@/lib/signed-media";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || "";
  const sig = req.nextUrl.searchParams.get("sig") || "";
  if (!key || !verifyMediaKey(key, sig)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const object = await getObject(key);
  if (!object) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": object.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=300",
    },
  });
}
