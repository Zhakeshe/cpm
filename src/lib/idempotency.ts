import { createHash } from "crypto";
import { Prisma, type PrismaClient } from "@prisma/client";

function error(code: string, status: number) { return Object.assign(new Error(code), { status }); }

/** Persist before side effects. An interrupted send stays uncertain and is never sent again automatically. */
export async function idempotent<T>(db: PrismaClient, userId: string, scope: string, key: string | null, payload: unknown, action: () => Promise<T>): Promise<T> {
  if (!key) throw error("IDEMPOTENCY_KEY_REQUIRED", 400);
  if (!/^[\w-]{16,100}$/.test(key)) throw error("INVALID_IDEMPOTENCY_KEY", 400);
  const id = createHash("sha256").update(`${userId}:${scope}:${key}`).digest("hex");
  const fingerprint = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  try {
    await db.operationRequest.create({ data: { id, fingerprint } });
  } catch (e) {
    if ((e as { code?: string }).code !== "P2002") throw e;
    const previous = await db.operationRequest.findUnique({ where: { id } });
    if (!previous || previous.fingerprint !== fingerprint) throw error("IDEMPOTENCY_CONFLICT", 409);
    if (previous.state === "DONE") return previous.result as T;
    throw error(previous.state === "UNCERTAIN" ? "ACTION_UNCERTAIN" : "ACTION_IN_PROGRESS", 409);
  }
  try {
    const result = await action();
    const json = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
    await db.operationRequest.update({ where: { id }, data: { state: "DONE", result: json } });
    return result;
  } catch (e) {
    // Retain the claim even if the provider accepted a send before the request failed.
    await db.operationRequest.update({ where: { id }, data: { state: "UNCERTAIN" } }).catch(() => undefined);
    throw e;
  }
}
