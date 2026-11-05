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

const pending = new Map<string, { key: string; promise?: Promise<unknown> }>();

/** Reuse the same claim on a network retry, and share concurrent identical submits. */
export async function mutationJson<T>(url: string, body: unknown): Promise<T> {
  const signature = url + JSON.stringify(body);
  let entry = pending.get(signature);
  if (!entry) {
    if (pending.size > 100) throw new Error("TOO_MANY_PENDING_ACTIONS");
    entry = { key: crypto.randomUUID() };
    pending.set(signature, entry);
  }
  if (entry.promise) return entry.promise as Promise<T>;
  const current = entry;
  current.promise = apiJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": current.key },
    body: JSON.stringify(body),
  }).then((value) => { pending.delete(signature); return value; }).catch((err) => {
    // Validation and permissions fail before the side effect; a corrected action can be retried.
    if (err instanceof ApiRequestError && err.status < 500 && ![409, 408].includes(err.status)) pending.delete(signature);
    throw err;
  }).finally(() => { current.promise = undefined; });
  return current.promise as Promise<T>;
}

export function friendlyError(error: unknown, locale = "ru"): string {
  const code = error instanceof Error ? error.message : "ERROR";
  const kk = locale === "kk";
  if (code === "ACTION_IN_PROGRESS") return kk ? "Әрекет орындалып жатыр. Біраздан кейін қайта тексеріңіз." : "Действие ещё выполняется. Подождите и проверьте результат.";
  if (code === "ACTION_UNCERTAIN") return kk ? "Нәтиже расталмады. Қайталамас бұрын тарихты тексеріңіз." : "Результат не подтверждён. Проверьте историю перед повторной отправкой.";
  if (code === "IDEMPOTENCY_CONFLICT") return kk ? "Алдыңғы әрекеттің деректері сәйкес емес. Бетті жаңартыңыз." : "Данные предыдущей попытки изменились. Обновите страницу.";
  if (code === "PASSWORD_TOO_SHORT") return kk ? "Пароль кемінде 8 таңбадан тұруы керек." : "Пароль должен содержать минимум 8 символов.";
  if (error instanceof TypeError) return kk ? "Желі қатесі. Енгізілген деректер сақталды; нәтижені тексеріп, қайталаңыз." : "Нет связи. Введённые данные сохранены; проверьте результат и повторите попытку.";
  if (error instanceof ApiRequestError && error.status === 429) return kk ? "Сұрау көп. Біраз күтіп қайталаңыз." : "Слишком много запросов. Немного подождите.";
  if (code === "INVALID_INPUT") return kk ? "Енгізілген деректерді тексеріңіз." : "Проверьте заполненные поля.";
  if (code === "ALREADY_EXISTS") return kk ? "Мұндай жазба бар. Тізімді тексеріңіз." : "Такая запись уже существует. Проверьте список.";
  if (error instanceof ApiRequestError && error.status === 403) return kk ? "Бұл әрекетке рұқсат жоқ." : "Нет доступа к этому действию.";
  return kk ? "Әрекет аяқталмады. Деректерді сақтап, нәтижені тексеріңіз." : "Не удалось завершить действие. Данные сохранены; проверьте результат.";
}
