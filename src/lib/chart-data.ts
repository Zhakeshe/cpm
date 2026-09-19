export type Series = Array<{ day: string; count: number }>;

const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  PHONE_CALL: "Звонок",
  MANUAL: "Вручную",
  WEBSITE: "Сайт",
  REFERRAL: "Рекомендация",
  OTHER: "Другое",
  META_LEAD_ADS: "Meta Lead Ads",
};

export function sourceLabel(source: string) {
  return SOURCE_LABELS[source] || source;
}

export function dayLabel(day: string | Date) {
  const d = new Date(day);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}
