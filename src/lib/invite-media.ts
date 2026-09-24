import type { InviteRoleId } from "@/lib/invite-copy";

export const ROLE_PHOTOS: Record<InviteRoleId, string> = {
  ftc_member: "/hero-field.jpg",
  designer: "/invite/ftc/gears.jpg",
  smm: "/invite/ftc/finals3.jpg",
  content: "/invite/ftc/drivers.jpg",
  video: "/invite/ftc/finals5.jpg",
  photo: "/invite/ftc/finals4.jpg",
  organizer: "/invite/ftc/finals1.jpg",
};

export const UNI_LOGOS = [
  "/invite/unis/first.svg",
  "/invite/unis/nu.svg",
  "/invite/unis/kbtu.png",
  "/invite/unis/aitu.png",
  "/invite/unis/sdu.png",
  "/invite/unis/satbayev.svg",
  "/invite/unis/enu.svg",
] as const;

export const PROGRAM_PHOTOS = [
  "/invite/ftc/finals4.jpg",
  "/invite/ftc/finals3.jpg",
  "/invite/ftc/finals5.jpg",
  "/hero-field.jpg",
] as const;

export const PROGRAM_FOCUS = ["42% 40%", "50% 35%", "55% 45%", "68% center"] as const;

export const FIRST_PARTNER_LOGOS = [
  "/invite/partners/p1.png",
  "/invite/partners/p2.jpg",
  "/invite/partners/p3.jpg",
  "/invite/partners/p4.jpg",
  "/invite/partners/p5.png",
  "/invite/partners/p6.png",
  "/invite/partners/p9.png",
  "/invite/partners/p10.png",
  "/invite/partners/p11.jpg",
  "/invite/partners/p12.png",
] as const;

export const KZ_PARTNER_LOGOS = [
  "/invite/kz/logo-01.png",
  "/invite/kz/logo-02.png",
  "/invite/kz/logo-03.png",
  "/invite/kz/logo-04.png",
  "/invite/kz/logo-05.png",
  "/invite/kz/logo-06.png",
  "/invite/kz/logo-07.png",
  "/invite/kz/logo-08.png",
  "/invite/kz/logo-09.png",
] as const;
