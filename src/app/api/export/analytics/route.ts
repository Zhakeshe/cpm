import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { rangeFromPreset } from "@/lib/analytics";
import { csvFilename, toCsv } from "@/lib/csv";
import { exportAnalytics } from "@/lib/export-data";
import { canSeeAllRecords } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const preset = req.nextUrl.searchParams.get("preset") || "week";
    const from = req.nextUrl.searchParams.get("from") || undefined;
    const to = req.nextUrl.searchParams.get("to") || undefined;
    const range = rangeFromPreset(preset, from, to);
    const scoped = canSeeAllRecords(user.role) ? undefined : user.id;
    const { summary, managers, tracking } = await exportAnalytics(range, scoped, canSeeAllRecords(user.role));

    const summaryCsv = toCsv(summary, [
      { key: "metric", label: "metric" },
      { key: "value", label: "value" },
    ]);
    const managersCsv = managers.length
      ? `\r\n\r\n${toCsv(
          managers.map((m) => ({
            name: m.name,
            email: m.email,
            newLeads: m.newLeads,
            processed: m.processed,
            conversations: m.conversations,
            calls: m.calls,
            demos: m.demos,
            sales: m.sales,
            conversion: Number(m.conversion.toFixed(4)),
            salesAmount: m.salesAmount,
            avgResponseSeconds: m.avgResponseSeconds,
          })),
          [
            { key: "name", label: "manager" },
            { key: "email", label: "email" },
            { key: "newLeads", label: "new_leads" },
            { key: "processed", label: "processed" },
            { key: "conversations", label: "whatsapp" },
            { key: "calls", label: "calls" },
            { key: "demos", label: "demos" },
            { key: "sales", label: "sales" },
            { key: "conversion", label: "conversion" },
            { key: "salesAmount", label: "sales_amount" },
            { key: "avgResponseSeconds", label: "avg_response_sec" },
          ],
        )}`
      : "";

    const trackingCsv = tracking.length
      ? `\r\n\r\n${toCsv(tracking, [
          { key: "title", label: "channel" },
          { key: "slug", label: "slug" },
          { key: "clicks", label: "clicks" },
          { key: "wrote", label: "wrote" },
          { key: "demos", label: "demos" },
          { key: "sales", label: "sales" },
          { key: "revenue", label: "revenue" },
          { key: "clickToWrite", label: "click_to_write_pct" },
          { key: "writeToDemo", label: "write_to_demo_pct" },
          { key: "writeToSale", label: "write_to_sale_pct" },
        ])}`
      : "";

    return new NextResponse(`\uFEFF${summaryCsv}${managersCsv}${trackingCsv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${csvFilename("analytics")}"`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
