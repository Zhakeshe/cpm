import type { InviteRoleId } from "@/lib/invite-copy";

export const ROLE_PHOTOS: Record<InviteRoleId, string> = {
  ftc_member: "/invite/arm.jpg",
  designer: "/invite/design.jpg",
  smm: "/invite/social.jpg",
  content: "/invite/studio.jpg",
  video: "/invite/video.jpg",
  photo: "/invite/camera.jpg",
  organizer: "/invite/event.jpg",
};

export const PROGRAMME_PHOTOS = ["/invite/workshop.jpg", "/invite/camera.jpg", "/invite/event.jpg"] as const;

export const PROGRAMME_INDEXES = [0, 2, 4] as const;
