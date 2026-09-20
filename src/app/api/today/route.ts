import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { myDay } from "@/lib/today";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await myDay(prisma, scopeManagerId(user.role, user.id)));
  } catch (err) {
    return jsonError(err);
  }
}
