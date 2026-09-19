import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { uploadMediaToMeta } from "@/lib/whatsapp";
import { extensionFor, putObject, storageConfigured } from "@/lib/storage";
import crypto from "crypto";

const MAX_BYTES = 25 * 1024 * 1024;

function mediaTypeFor(mime: string, voiceNote?: boolean): "IMAGE" | "DOCUMENT" | "AUDIO" | "VIDEO" | "VOICE" {
  if (voiceNote) return "VOICE";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  const audio = mime.split(";")[0].trim();
  if (audio.startsWith("audio/")) {
    if (audio === "audio/ogg" || audio === "audio/webm" || audio === "audio/opus") return "VOICE";
    return "AUDIO";
  }
  return "DOCUMENT";
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const contactId = String(form.get("contactId") || "");
    const file = form.get("file");
    if (!contactId || !(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
    }
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (scopeManagerId(user.role, user.id) && contact.managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const voiceNote = String(form.get("voiceNote") || "") === "1";
    const mime = file.type || (voiceNote ? "audio/ogg" : "application/octet-stream");
    const uploaded = await uploadMediaToMeta({ buffer, mime: mime.split(";")[0], name: file.name });

    let storageKey: string | undefined;
    if (storageConfigured()) {
      storageKey = `whatsapp/out/${crypto.randomUUID()}.${extensionFor(mime)}`;
      await putObject(storageKey, buffer, mime);
    }

    return NextResponse.json({
      media: {
        type: mediaTypeFor(mime, voiceNote),
        metaMediaId: uploaded.id,
        storageKey,
        mimeType: mime.split(";")[0],
        fileName: file.name,
        size: buffer.length,
        voiceNote: voiceNote || mediaTypeFor(mime, voiceNote) === "VOICE",
      },
      mocked: uploaded.mocked,
    });
  } catch (err) {
    return jsonError(err);
  }
}
