import type { InviteRoleId } from "@/lib/invite-copy";

export const ROLE_PHOTOS: Record<InviteRoleId, string> = {
  ftc_member: "/hero-field.jpg",
  designer: "/invite/ftc/gears.jpg",
  smm: "/invite/ftc/bot.jpg",
  content: "/invite/ftc/drivers.jpg",
  video: "/hero-field.jpg",
  photo: "/invite/ftc/bot.jpg",
  organizer: "/invite/ftc/gears.jpg",
};

export const ROLE_FOCUS: Record<InviteRoleId, string> = {
  ftc_member: "68% center",
  designer: "50% 40%",
  smm: "50% 35%",
  content: "50% 40%",
  video: "30% 60%",
  photo: "70% 20%",
  organizer: "20% 70%",
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

export const PROGRAM_CARDS = [
  {
    photo: "/invite/programs/discover.png",
    mark: "/invite/programs/discover-mark.png",
    color: "#CA32FF",
    youtube: "yF_zKolSUI8",
    more: "https://www.firstrobotics.kz/ru/fll-discover/",
  },
  {
    photo: "/invite/programs/explore.png",
    mark: "/invite/programs/explore-mark.png",
    color: "#00BA34",
    youtube: "BayY9b0uX8A",
    more: "https://www.firstrobotics.kz/ru/fll-explore/",
  },
  {
    photo: "/invite/programs/challenge.png",
    mark: "/invite/programs/challenge-mark.png",
    color: "#FF4848",
    youtube: "MkpSgkw8A7I",
    more: "https://www.firstrobotics.kz/ru/fll-challenge/",
  },
  {
    photo: "/invite/programs/ftc.png",
    mark: "/invite/programs/ftc-mark.png",
    color: "#FF7A00",
    youtube: "dxfRKaqIiP8",
    more: "https://www.firstrobotics.kz/ru/ftc/",
  },
] as const;

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
