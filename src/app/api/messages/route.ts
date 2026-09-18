import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { emitToUser } from "@/lib/realtime";
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
  conversationId: z.string().optional(),
  contactId: z.string(),
  text: z.string().min(1),
  type: z.enum(["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "VOICE", "VIDEO", "TEMPLATE"]).optional(),
  mediaUrl: z.string().optional(),
  templateName: z.string().optional(),
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
    const conversation = await prisma.conversation.upsert({
      where: { contactId_channel: { contactId: contact.id, channel: "whatsapp" } },
      create: {
        contactId: contact.id,
        managerId: contact.managerId,
        channel: "whatsapp",
      },
      update: {},
    });
    const sent = await sendWhatsAppText({
      to: contact.whatsappNumber || contact.phoneNormalized,
      text: body.text,
      templateName: body.templateName,
    });
    const message = await prisma.message.create({
      data: {
        externalMessageId: sent.id,
        conversationId: conversation.id,
        contactId: contact.id,
        managerId: user.id,
        direction: "OUTBOUND",
        type: body.templateName ? "TEMPLATE" : body.type || "TEXT",
        text: body.text,
        mediaUrl: body.mediaUrl,
        status: "SENT",
      },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: body.text, lastMessageAt: new Date(), unreadCount: 0 },
    });
    await prisma.activity.create({
      data: {
        contactId: contact.id,
        managerId: user.id,
        type: "WHATSAPP_OUT",
        title: "Исходящее сообщение WhatsApp",
        payload: { messageId: message.id },
      },
    });
    emitToUser(user.id, "whatsapp:message", { conversationId: conversation.id, messageId: message.id });
    return NextResponse.json({ message, mocked: sent.mocked });
  } catch (err) {
    return jsonError(err);
  }
}
