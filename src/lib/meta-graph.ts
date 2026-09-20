export function graphVersion() {
  return process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
}

export function graphUrl(path: string, query?: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${graphVersion()}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function whatsappCredentials() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";
  return {
    token,
    phoneNumberId,
    wabaId,
    configured: Boolean(token && (phoneNumberId || wabaId)),
  };
}

export async function graphGet<T>(path: string, query?: Record<string, string>): Promise<T> {
  const { token } = whatsappCredentials();
  if (!token) {
    throw Object.assign(new Error("WHATSAPP_NOT_CONFIGURED"), { status: 400 });
  }
  const res = await fetch(graphUrl(path, query), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const raw = await res.text();
  let json: T & { error?: { message?: string; code?: number } };
  try {
    json = JSON.parse(raw) as T & { error?: { message?: string; code?: number } };
  } catch {
    throw Object.assign(new Error(`META_GRAPH_INVALID_JSON:${res.status}`), { status: 502 });
  }
  if (!res.ok) {
    const message = json.error?.message || `META_GRAPH_${res.status}`;
    throw Object.assign(new Error(message), { status: 502, metaCode: json.error?.code });
  }
  return json;
}
