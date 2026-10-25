import type { PrismaClient } from "@prisma/client";
import { getWazzupConfig, whatsappTransport } from "./whatsapp-transport";

export const GREETING_SETTING = "whatsapp:auto-greeting";
export const DEFAULT_WHATSAPP_GREETING = `Сәлеметсіз бе! 😊

Сіз Quantum X заманауи пылесосына қызығушылық таныттыңыз.

🇺🇸 Quantum X — америкалық технологияға негізделген, сүзгісіз, сумен жұмыс істейтін сепараторлық пылесос.

✨ Кілем, диван, матрас тазалауға арналған
💧 Сүзгісін ауыстыру қажет емес
🏡 Үйіңізде ТЕГІН ДЕМОНСТРАЦИЯ өткіземіз!

Егер қызықтырса, осы хабарламаға «+» белгісін жіберіңіз. Мен сізге толық ақпарат беремін.

Егер хабарлама алғыңыз келмесе, «Тоқтату» деп жазыңыз.`;

export type GreetingConfig = { enabled: boolean; text: string; enabledAt: string | null };

export async function getGreetingConfig(db: PrismaClient): Promise<GreetingConfig> {
  const row = await db.systemSetting.findUnique({ where: { key: GREETING_SETTING } });
  const value = row?.value as Partial<GreetingConfig> | undefined;
  return {
    enabled: value?.enabled === true,
    text: typeof value?.text === "string" ? value.text : DEFAULT_WHATSAPP_GREETING,
    enabledAt: typeof value?.enabledAt === "string" ? value.enabledAt : null,
  };
}

export function isWhatsAppOptOut(text?: string | null) {
  const normalized = (text || "").normalize("NFKC").trim().toLocaleLowerCase().replace(/^[\s«»"'“”.,!?]+|[\s«»"'“”.,!?]+$/gu, "");
  return ["тоқтату", "токтату", "стоп", "stop", "отписаться"].includes(normalized);
}

type GreetingParams = {
  contactId: string;
  messageId: string;
  text?: string | null;
  receivedAt: Date;
  provider: "wazzup" | "meta";
  channelId?: string;
};

/** Called only for a saved customer message, never for echoes, status updates or imported leads. */
export async function maybeSendWhatsAppGreeting(db: PrismaClient, params: GreetingParams) {
  const optOutKey = `whatsapp:opt-out:${params.contactId}`;
  if (isWhatsAppOptOut(params.text)) {
    await db.systemSetting.upsert({
      where: { key: optOutKey },
      create: { key: optOutKey, value: { at: new Date().toISOString(), messageId: params.messageId } },
      update: { value: { at: new Date().toISOString(), messageId: params.messageId } },
    });
    return;
  }
  const config = await getGreetingConfig(db);
  const enabledAt = config.enabledAt ? Date.parse(config.enabledAt) : NaN;
  const receivedAt = params.receivedAt.getTime();
  // Historical webhook deliveries must not start a campaign or send outside the service window.
  if (!config.enabled || !config.text.trim() || !Number.isFinite(enabledAt) ||
      !Number.isFinite(receivedAt) || receivedAt < enabledAt ||
      receivedAt < Date.now() - 5 * 60_000 || receivedAt > Date.now() + 60_000) return;
  if (await db.systemSetting.findUnique({ where: { key: optOutKey } })) return;

  const transport = await whatsappTransport(db);
  if (transport !== params.provider) return; // Never silently use a mock or another sender.
  if (transport === "wazzup") {
    const channel = await getWazzupConfig(db);
    if (!params.channelId || params.channelId !== channel.channelId) return;
  }

  const first = await db.message.findFirst({
    where: { contactId: params.contactId, direction: "INBOUND" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (first?.id !== params.messageId) return;
  const contact = await db.contact.findUnique({ where: { id: params.contactId } });
  if (!contact || contact.archivedAt) return;

  // A durable unique claim precedes the network request. Uncertain sends are not retried.
  const claimKey = `whatsapp:welcome:${params.contactId}`;
  try {
    await db.systemSetting.create({
      data: { key: claimKey, value: { state: "CLAIMED", messageId: params.messageId, at: new Date().toISOString() } },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return;
    throw err;
  }
  try {
    if (await db.systemSetting.findUnique({ where: { key: optOutKey } })) {
      await db.systemSetting.update({ where: { key: claimKey }, data: { value: { state: "OPTED_OUT" } } });
      return;
    }
    // Recheck the switch immediately before the side effect, including during an admin edit.
    const current = await getGreetingConfig(db);
    if (!current.enabled) {
      await db.systemSetting.update({ where: { key: claimKey }, data: { value: { state: "CANCELLED" } } });
      return;
    }
    const { sendOutboundMessage } = await import("./outbound");
    const result = await sendOutboundMessage(db, {
      contactId: contact.id,
      senderId: contact.managerId,
      text: current.text,
      automatic: true,
    });
    await db.systemSetting.update({
      where: { key: claimKey },
      data: { value: { state: "SENT", messageId: result.message.id, at: new Date().toISOString() } },
    });
  } catch {
    await db.systemSetting.update({
      where: { key: claimKey }, data: { value: { state: "UNCERTAIN", at: new Date().toISOString() } },
    });
    console.error("whatsapp_greeting_uncertain", params.messageId);
  }
}
