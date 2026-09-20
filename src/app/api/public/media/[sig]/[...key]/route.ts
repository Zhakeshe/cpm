import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/storage";
import { verifyMediaKey } from "@/lib/signed-media";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ sig: string; key: string[] }> }) {
  const { sig, key: parts } = await ctx.params;
  const key = parts.map((part) => decodeURIComponent(part)).join("/");
  if (!key || key.includes("..") || !verifyMediaKey(key, sig)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const object = await getObject(key);
  if (!object) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const name = key.split("/").pop() || "file";
  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": object.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
