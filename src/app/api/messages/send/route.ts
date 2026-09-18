import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { sendOutboundMessage } from "@/lib/outbound";
import { z } from "zod";

const schema = z.object({
  contactId: z.string(),
  text: z.string().optional(),
  templateId: z.string().optional(),
  templateParameters: z.array(z.string()).optional(),
  media: z
    .object({
      type: z.enum(["IMAGE", "DOCUMENT", "AUDIO", "VIDEO"]),
      metaMediaId: z.string(),
      storageKey: z.string().optional(),
      mimeType: z.string().optional(),
      fileName: z.string().optional(),
      size: z.number().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const contact = await prisma.contact.findUnique({ where: { id: body.contactId } });
    if (!contact) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (scopeManagerId(user.role, user.id) && contact.managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const result = await sendOutboundMessage(prisma, {
      contactId: body.contactId,
      senderId: user.id,
      text: body.text,
      templateId: body.templateId,
      templateParameters: body.templateParameters,
      media: body.media,
    });
    return NextResponse.json({ message: result.message, mocked: result.mocked });
  } catch (err) {
    return jsonError(err);
  }
}
