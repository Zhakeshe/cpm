import type { Metadata } from "next";
import { InviteApp } from "@/components/invite-app";
import { INVITE_PUBLIC_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "K.E.R.N FTC · Қаз / Рус / Eng",
  description:
    "K.E.R.N FTC командасына өтініш — робототехника, дизайн, SMM, контент, видео, фото және қолдау.",
  alternates: { canonical: INVITE_PUBLIC_URL },
  openGraph: {
    title: "K.E.R.N FTC командасына қосыл",
    description: "Робот, медиа, бренд — бір экипаж. Астана.",
    url: INVITE_PUBLIC_URL,
  },
};

export default function InvitePage() {
  return <InviteApp />;
}
