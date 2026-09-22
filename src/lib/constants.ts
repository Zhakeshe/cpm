export const NAV_LINKS = [
  { href: "#about", label: "О мероприятии" },
  { href: "#format", label: "Формат" },
  { href: "#register", label: "Регистрация" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacts", label: "Контакты" },
] as const;

export const FTC_EXPERIENCE = [
  { value: "first_season", label: "Первый сезон" },
  { value: "1_season", label: "1 сезон" },
  { value: "2_seasons", label: "2 сезона" },
  { value: "3_plus_seasons", label: "3+ сезона" },
] as const;

export const ROBOT_STATUS = [
  { value: "ready", label: "Да" },
  { value: "in_progress", label: "В процессе сборки" },
  { value: "none", label: "Пока нет" },
] as const;

export const TESTING_AREAS = [
  { value: "autonomous", label: "Autonomous" },
  { value: "teleop", label: "TeleOp" },
  { value: "intake", label: "Intake" },
  { value: "scoring", label: "Scoring mechanism" },
  { value: "drive", label: "Drive system" },
  { value: "vision", label: "Vision / Limelight" },
  { value: "strategy", label: "Strategy" },
  { value: "other", label: "Другое" },
] as const;

export const MEMBER_COUNTS = [4, 5] as const;

export const TBA = "Будет объявлено дополнительно";

export const CONTACTS = {
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    "https://www.instagram.com/kern.school.kz/",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/77775888030",
};

export function experienceLabel(value: string) {
  return FTC_EXPERIENCE.find((item) => item.value === value)?.label ?? value;
}

export function robotStatusLabel(value: string) {
  return ROBOT_STATUS.find((item) => item.value === value)?.label ?? value;
}

export function testingAreaLabel(value: string) {
  return TESTING_AREAS.find((item) => item.value === value)?.label ?? value;
}
