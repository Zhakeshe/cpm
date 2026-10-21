"use client";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload: unknown,
  ) {
    super(message);
  }
}

/** Parse JSON only after checking the response and consistently handle expired sessions. */
export async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = await response.json().catch(() => null) as { error?: string } | null;

  if (!response.ok) {
    if (response.status === 401 || payload?.error === "ACCOUNT_DISABLED") {
      window.location.assign("/login");
    }
    throw new ApiRequestError(payload?.error || `HTTP_${response.status}`, response.status, payload);
  }

  return payload as T;
}
