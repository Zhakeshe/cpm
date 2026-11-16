export type SipExtension = string | { username: string; password: string };

export type SipSettings = {
  wsUrl?: string;
  domain?: string;
  extensions?: Record<string, SipExtension>;
};

/** PBX extension (101) and authentication login (593615-101) are different. */
export function resolveSipAccount(config: SipSettings, extension: string, username?: string | null) {
  const account = config.extensions?.[extension];
  if (!account) return null;
  const password = typeof account === "string" ? account : account.password;
  const login = typeof account === "string" ? username || extension : account.username;
  if (!password || !login) return null;
  return { username: login, password };
}
