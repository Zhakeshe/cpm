/**
 * Direct Meta WABA is parked on purpose while Wazzup is the live channel.
 * Do not delete these modules — switch back with WHATSAPP_TRANSPORT=meta.
 */
export const META_WABA_PARKED_MODULES = [
  "src/lib/whatsapp.ts",
  "src/lib/meta-graph.ts",
  "src/lib/meta-waba.ts",
  "src/lib/meta-webhook.ts",
  "src/app/api/webhooks/whatsapp/route.ts",
  "src/app/api/meta/waba/route.ts",
] as const;

export function isMetaWabaParked(transport: "wazzup" | "meta" | "mock") {
  return transport !== "meta";
}

export function restoreMetaWabaSteps() {
  return "WHATSAPP_TRANSPORT=meta and keep WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID / WABA id";
}
