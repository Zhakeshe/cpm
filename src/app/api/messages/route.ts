import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { sendOutboundMessage } from "@/lib/outbound";
import { z } from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const managerId = scopeManagerId(user.role, user.id);
    const conversations = await prisma.conversation.findMany({
      where: managerId ? { managerId } : {},
      include: {
        contact: { include: { manager: { select: { id: true, name: true } }, pipelineStage: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 200,
    });
    return NextResponse.json(conversations);
  } catch (err) {
    return jsonError(err);
  }
}

const sendSchema = z.object({
  contactId: z.string(),
  text: z.string().optional(),
  templateId: z.string().optional(),
  templateParameters: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = sendSchema.parse(await req.json());
    const contact = await prisma.contact.findUnique({ where: { id: body.contactId } });
    if (!contact) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const managerId = scopeManagerId(user.role, user.id);
    if (managerId && contact.managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const result = await sendOutboundMessage(prisma, {
      contactId: contact.id,
      senderId: user.id,
      text: body.text,
      templateId: body.templateId,
      templateParameters: body.templateParameters,
    });
    return NextResponse.json({ message: result.message, mocked: result.mocked });
  } catch (err) {
    return jsonError(err);
  }
}
