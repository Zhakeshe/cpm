import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ZADARMA_DEFAULTS } from "../src/lib/zadarma";

const extensionsSchema = z.record(z.string().regex(/^\d+$/), z.object({
  username: z.string().regex(/^\d+(?:-\d+)?$/),
  password: z.string().min(1),
}));

async function main() {
  // Credentials are supplied through an ignored .env.local, never a source file.
  let extensions: z.infer<typeof extensionsSchema>;
  try {
    extensions = extensionsSchema.parse(JSON.parse(process.env.SIP_EXTENSIONS_JSON || ""));
  } catch {
    throw new Error("Set SIP_EXTENSIONS_JSON to an object of extension: { username, password } entries.");
  }
  const numbers = Object.keys(extensions).sort((a, b) => Number(a) - Number(b));
  if (!numbers.length) throw new Error("At least one SIP extension is required.");
  const prisma = new PrismaClient();
  try {
    const assignments = await prisma.$transaction(async (db) => {
      const managers = await db.user.findMany({
        where: { isActive: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, email: true, sipExtension: true },
      });
      if (managers.length < numbers.length) {
        throw new Error(`Need ${numbers.length} active users; found ${managers.length}. No settings changed.`);
      }
      const assignedManagerIds = new Set<string>();
      const assignments = numbers.map((extension) => {
        const currentOwner = managers.find((manager) =>
          manager.sipExtension === extension && !assignedManagerIds.has(manager.id));
        const manager = currentOwner || managers.find((candidate) => !assignedManagerIds.has(candidate.id));
        if (!manager) throw new Error(`No active user available for extension ${extension}. No settings changed.`);
        assignedManagerIds.add(manager.id);
        return {
          id: manager.id,
          email: manager.email,
          extension,
          username: extensions[extension].username,
        };
      });
      if (process.argv.includes("--dry-run")) return assignments;

      // Remove previous owners so two users cannot register the same extension.
      await db.user.updateMany({
        where: { OR: [
          { sipExtension: { in: numbers } },
          { sipUsername: { in: assignments.map((a) => a.username) } },
        ] },
        data: { sipExtension: null, sipUsername: null },
      });
      for (const assignment of assignments) {
        await db.user.update({
          where: { id: assignment.id },
          data: { sipExtension: assignment.extension, sipUsername: assignment.username },
        });
      }
      const existing = await db.integration.findUnique({ where: { type: "TELEPHONY" } });
      const previous = (existing?.config || {}) as Record<string, unknown>;
      const config = {
        ...previous,
        wsUrl: process.env.SIP_WS_URL || ZADARMA_DEFAULTS.wsUrl,
        domain: process.env.SIP_DOMAIN || ZADARMA_DEFAULTS.domain,
        extensions,
      };
      await db.integration.upsert({
        where: { type: "TELEPHONY" },
        create: { type: "TELEPHONY", status: "DISCONNECTED", config },
        update: { status: "DISCONNECTED", config, lastError: null },
      });
      return assignments;
    });
    for (const assignment of assignments) {
      console.log(`${assignment.email}: extension ${assignment.extension}, SIP login ${assignment.username}`);
    }
    console.log(process.argv.includes("--dry-run") ? "Preview only; no settings changed." : "Saved. Refresh CRM to register the softphone; SIP registration has not been verified.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  // Database error details can contain connection strings or submitted credentials.
  console.error(error instanceof Error && !error.name.startsWith("Prisma") ? error.message : "Zadarma setup failed. Check database access.");
  process.exitCode = 1;
});
