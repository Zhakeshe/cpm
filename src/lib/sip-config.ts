import { z } from "zod";

export const sipLoginSchema = z.string().regex(/^\d+(?:-\d+)?$/);
export const sipAccountsSchema = z.record(z.string().regex(/^\d+$/), z.object({
  username: sipLoginSchema,
  password: z.string().min(1).optional(),
  // A verified provider PBX routing extension; never inferred from the CRM extension.
  pbxExtension: z.string().regex(/^\d+$/).optional(),
}));
export type SipAccounts = z.infer<typeof sipAccountsSchema>;
export type SipSettings = { wsUrl?: string; domain?: string; extensions?: Record<string, unknown> };

export function serverSipAccounts(): SipAccounts {
  try {
    const accounts = sipAccountsSchema.parse(JSON.parse(process.env.SIP_ACCOUNTS_JSON || "{}"));
    const logins = Object.values(accounts).map((a) => a.username);
    const routing = Object.values(accounts).map((a) => a.pbxExtension).filter(Boolean);
    if (new Set(logins).size !== logins.length || new Set(routing).size !== routing.length) throw new Error();
    return accounts;
  } catch {
    throw Object.assign(new Error("SIP_ACCOUNT_NOT_CONFIGURED"), { status: 503 });
  }
}

export function resolveOutboundSipAccount(
  manager: { sipExtension: string | null; sipUsername: string | null },
  accounts = serverSipAccounts(),
) {
  const configured = manager.sipExtension ? accounts[manager.sipExtension] : undefined;
  if (configured && manager.sipUsername && configured.username !== manager.sipUsername) {
    throw Object.assign(new Error("SIP_ACCOUNT_NOT_CONFIGURED"), { status: 503 });
  }
  const sipAccount = configured?.username || manager.sipUsername;
  if (!sipAccount || !sipLoginSchema.safeParse(sipAccount).success) {
    throw Object.assign(new Error("SIP_ACCOUNT_NOT_CONFIGURED"), { status: 503 });
  }
  // Full authentication login and provider routing ID are deliberately separate.
  return { sipAccount, callbackEndpoint: configured?.pbxExtension || sipAccount };
}

export function resolveSipAccount(_config: SipSettings, extension: string, username?: string | null) {
  const account = serverSipAccounts()[extension];
  if (!account?.password || (username && username !== account.username)) return null;
  return { username: account.username, password: account.password };
}

export function publicSipSettings(config: SipSettings) {
  return { wsUrl: config.wsUrl, domain: config.domain };
}
