import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { searchContacts } from "@/lib/search";
import { scopeManagerId } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const q = req.nextUrl.searchParams.get("q") || "";
    const managerId = scopeManagerId(user.role, user.id);
    const results = await searchContacts(q, managerId);
    return NextResponse.json(results);
  } catch (err) {
    return jsonError(err);
  }
}
