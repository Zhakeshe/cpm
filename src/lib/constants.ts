export const NAV_LINKS = [
  { href: "#about", label: "О мероприятии" },
  { href: "#biobuzz", label: "BIOBUZZ" },
  { href: "#format", label: "Формат" },
  { href: "#venue", label: "Адрес" },
  { href: "#register", label: "Регистрация" },
  { href: "#faq", label: "FAQ" },
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

export const VENUE = {
  name: "K.E.R.N School",
  address: "Жошы хан көшесі, 10Б",
  city: "Астана",
  twoGisUrl: "https://2gis.kz/astana/search/%D0%96%D0%BE%D1%88%D1%8B%20%D1%85%D0%B0%D0%BD%2010%D0%91",
  lat: 51.1254,
  lon: 71.4267,
};

export const CONTACTS = {
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    "https://www.instagram.com/kern.school.kz/",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/77775888030",
};

export function robotStatusLabel(value: string) {
  return ROBOT_STATUS.find((item) => item.value === value)?.label ?? value;
}

export function testingAreaLabel(value: string) {
  return TESTING_AREAS.find((item) => item.value === value)?.label ?? value;
}
