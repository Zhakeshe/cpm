import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { inviteSchema } from "@/lib/validation";

const recentFingerprints = new Map<string, number>();
const WINDOW_MS = 60_000;

function fingerprintOf(data: {
  fullName: string;
  phone: string;
  role: string;
}) {
  const raw = [data.fullName, data.phone, data.role]
    .map((value) => value.trim().toLowerCase())
    .join("|");
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the form",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const payload = parsed.data;
  const fingerprint = fingerprintOf(payload);
  const lastSeen = recentFingerprints.get(fingerprint);
  if (lastSeen && Date.now() - lastSeen < WINDOW_MS) {
    return NextResponse.json(
      { error: "This application was just sent. Please wait before trying again." },
      { status: 409 },
    );
  }

  const duplicate = await prisma.teamInvite.findFirst({
    where: {
      fingerprint,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "We already have this application." },
      { status: 409 },
    );
  }

  try {
    const record = await prisma.teamInvite.create({
      data: {
        fullName: payload.fullName,
        grade: payload.grade,
        school: payload.school?.trim() || "K.E.R.N School",
        city: payload.city,
        languages: payload.languages,
        availability: payload.availability,
        heardFrom: payload.heardFrom,
        superpower: payload.superpower,
        phone: payload.phone,
        social: payload.social,
        role: payload.role,
        whyJoin: payload.whyJoin,
        skills: payload.skills,
        portfolio: payload.portfolio || null,
        fingerprint,
      },
      select: { id: true },
    });

    recentFingerprints.set(fingerprint, Date.now());
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not save the application. Try again in a moment." },
      { status: 500 },
    );
  }
}
