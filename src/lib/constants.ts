export const NAV_LINKS = [
  { href: "#about", label: "О мероприятии" },
  { href: "#biobuzz", label: "BIOBUZZ" },
  { href: "#venue", label: "Адрес" },
  { href: "#register", label: "Регистрация" },
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

export const EVENT = {
  name: "K.E.R.N: NoRegrets Scrimmage",
  dateLabel: "24 сентября 2026",
  dateShort: "24.09.2026",
  timeLabel: "18:00",
  startsAt: "2026-09-24T18:00:00+05:00",
} as const;

export const VENUE = {
  name: "K.E.R.N School",
  address: "Жошы хан көшесі, 10Б",
  city: "Астана",
  twoGisUrl: "https://2gis.kz/astana/firm/70000001114203668",
  twoGisFirmId: "70000001114203668",
  lat: 51.099707,
  lon: 71.441875,
};

export function twoGisWidgetUrl() {
  const options = {
    pos: { lat: VENUE.lat, lon: VENUE.lon, zoom: 16 },
    opt: { city: "astana" },
    org: VENUE.twoGisFirmId,
  };
  return `https://widgets.2gis.com/widget?type=firmsonmap&options=${encodeURIComponent(
    JSON.stringify(options),
  )}`;
}

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
