import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { dashboardStats } from "@/lib/analytics";

export async function GET() {
  try {
    const user = await requireUser();
    const stats = await dashboardStats(user);
    return NextResponse.json(stats);
  } catch (err) {
    return jsonError(err);
  }
}
