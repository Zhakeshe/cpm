import ru from "@/i18n/ru.json";
import kk from "@/i18n/kk.json";

const dictionaries = { ru, kk } as const;
export type Locale = keyof typeof dictionaries;

export function getDictionary(locale: Locale = "ru") {
  return dictionaries[locale] || ru;
}

export function t(dict: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}
