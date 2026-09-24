import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { InviteCta } from "@/components/invite-cta";
import { InviteForm } from "@/components/invite-form";
import { InviteHeader } from "@/components/invite-header";
import { InviteHero } from "@/components/invite-hero";
import { InviteRoles } from "@/components/invite-roles";
import { InviteWho } from "@/components/invite-who";
import { InviteWhy } from "@/components/invite-why";
import { INVITE_PUBLIC_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Join the K.E.R.N FTC Team",
  description:
    "Apply to the K.E.R.N FTC team — robotics, design, SMM, content, video, photo, and team support.",
  alternates: { canonical: INVITE_PUBLIC_URL },
  openGraph: {
    title: "Join the K.E.R.N FTC Team",
    description:
      "We are looking for students who want to build, create, promote, and grow together.",
    url: INVITE_PUBLIC_URL,
  },
};

export default function InvitePage() {
  return (
    <>
      <InviteHeader />
      <main>
        <InviteHero />
        <InviteWhy />
        <InviteRoles />
        <InviteWho />
        <section id="apply" className="bg-paper">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-navy">
              Application form
            </h2>
            <p className="mt-3 text-[16px] leading-7 text-muted">
              Tell us who you are and which role you want. We read every
              application and write back.
            </p>
            <div className="mt-8">
              <InviteForm />
            </div>
          </div>
        </section>
        <InviteCta />
      </main>
      <Footer />
    </>
  );
}
