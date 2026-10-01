import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { serverSipAccounts } from "../src/lib/sip-config";

async function main() {
  const accounts = serverSipAccounts();
  let mapping: Record<string, string>;
  try {
    mapping = z.record(z.string().min(1), z.string().regex(/^\d+$/))
      .parse(JSON.parse(process.env.SIP_USER_MAPPING_JSON || ""));
  } catch {
    throw new Error("Set SIP_USER_MAPPING_JSON to an explicit user ID -> logical CRM extension mapping.");
  }
  if (!Object.keys(mapping).length || new Set(Object.values(mapping)).size !== Object.values(mapping).length) {
    throw new Error("Mapping must contain unique explicit assignments.");
  }
  const prisma = new PrismaClient();
  try {
    const assignments = await prisma.$transaction(async (db) => {
      const result = [];
      for (const [userId, logicalExtension] of Object.entries(mapping)) {
        const account = accounts[logicalExtension];
        if (!account) throw new Error("SIP_ACCOUNT_NOT_CONFIGURED");
        const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true } });
        if (!user?.isActive) throw new Error("Every mapped user must exist and be active.");
        const other = await db.user.findFirst({ where: {
          id: { not: userId }, OR: [{ sipExtension: logicalExtension }, { sipUsername: account.username }],
        } });
        if (other) throw new Error("Assignment already owned by another user. Resolve explicitly; no users changed.");
        result.push({ userId, logicalExtension, sipAccount: account.username });
      }
      if (!process.argv.includes("--dry-run")) {
        for (const a of result) await db.user.update({ where: { id: a.userId }, data: {
          sipExtension: a.logicalExtension, sipUsername: a.sipAccount,
        } });
      }
      return result;
    });
    for (const a of assignments) console.log(a);
    console.log(process.argv.includes("--dry-run") ? "Preview only; no settings changed." : "Explicit assignments saved. Passwords remain in server env.");
  } finally { await prisma.$disconnect(); }
}

main().catch(() => {
  // Never print database errors or Zod payloads containing credentials.
  console.error("Zadarma setup failed. Check explicit mapping, account configuration and existing owners; no partial assignments saved.");
  process.exitCode = 1;
});
