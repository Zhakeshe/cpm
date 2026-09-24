export const NAV_LINKS = [
  { href: "#about", label: "О мероприятии" },
  { href: "#biobuzz", label: "BIOBUZZ" },
  { href: "#venue", label: "Адрес" },
  { href: "#register", label: "Регистрация" },
] as const;

export const INVITE_NAV_LINKS = [
  { href: "#why", label: "Why join" },
  { href: "#roles", label: "Roles" },
  { href: "#who", label: "Who can apply" },
  { href: "#apply", label: "Apply" },
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

export const INVITE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_INVITE_URL || "https://kern.ushqn.com/invite";

export const INVITE_ROLES = [
  {
    value: "ftc_member",
    title: "FTC Team Member",
    text: "Build, program, and drive robots. Learn mechanics, Autonomous, and TeleOp on a real FIRST field.",
  },
  {
    value: "designer",
    title: "Designer",
    text: "Shape the team look: posters, merch, pit graphics, and a brand that feels like K.E.R.N.",
  },
  {
    value: "smm",
    title: "SMM Manager",
    text: "Run Instagram and stories. Plan posts, talk to the audience, and grow the team’s voice.",
  },
  {
    value: "content",
    title: "Content Creator",
    text: "Write captions, scripts, and recaps. Turn match days and workshops into stories people share.",
  },
  {
    value: "video",
    title: "Video Editor",
    text: "Cut highlight reels, reveal videos, and short-form clips for Reels and TikTok.",
  },
  {
    value: "photo",
    title: "Photographer / Media Team",
    text: "Shoot robots, people, and events. Build a photo archive the team can actually use.",
  },
  {
    value: "organizer",
    title: "Organizer / Team Support",
    text: "Keep the team moving: checklists, outreach, guests, and day-of help at events.",
  },
] as const;

export const INVITE_BENEFITS = [
  {
    title: "Real FTC experience",
    text: "Work on a competition robot and see how a FIRST team actually runs.",
  },
  {
    title: "Teamwork and leadership",
    text: "Own a role, meet deadlines, and learn how to lead a small crew.",
  },
  {
    title: "Media and content",
    text: "Film, write, and post for a live team — not a classroom mock project.",
  },
  {
    title: "Design and branding",
    text: "Practice visual identity on merch, posts, and event graphics.",
  },
  {
    title: "Events and competitions",
    text: "Be on the floor at scrimmages, outreach, and official FTC days.",
  },
  {
    title: "Portfolio that grows",
    text: "Leave the season with work you can show: photos, edits, code, or ops.",
  },
] as const;

export const INVITE_WHO = [
  "Students into robotics, media, design, teamwork, or event support",
  "Motivated and responsible — you show up and finish what you start",
  "Ready to work in a team and keep deadlines",
  "Open to learning tools you have not used yet",
] as const;

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

export function inviteRoleLabel(value: string) {
  return INVITE_ROLES.find((item) => item.value === value)?.title ?? value;
}
