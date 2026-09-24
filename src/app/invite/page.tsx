import type { Metadata } from "next";
import { InviteApp } from "@/components/invite-app";
import { INVITE_PUBLIC_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "K.E.R.N FTC · қабылдау",
  description:
    "K.E.R.N School FTC командасына қабылдау. Робототехника, медиа, дизайн, ұйымдастыру. Астана.",
  alternates: { canonical: INVITE_PUBLIC_URL },
  openGraph: {
    title: "K.E.R.N FTC · қабылдау",
    description: "FIRST Tech Challenge командасына өтініш. Астана.",
    url: INVITE_PUBLIC_URL,
  },
};

export default function InvitePage() {
  return <InviteApp />;
}
