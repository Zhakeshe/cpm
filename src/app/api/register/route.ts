import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation";

const recentFingerprints = new Map<string, number>();
const WINDOW_MS = 60_000;

function fingerprintOf(data: {
  teamName: string;
  school: string;
  captainName: string;
  phone: string;
}) {
  const raw = [
    data.teamName,
    data.school,
    data.captainName,
    data.phone,
  ]
    .map((value) => value.trim().toLowerCase())
    .join("|");
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректный формат запроса" },
      { status: 400 },
    );
  }

  const parsed = registrationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Проверьте заполнение формы",
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
      { error: "Эта заявка уже была отправлена. Подождите и не отправляйте форму повторно." },
      { status: 409 },
    );
  }

  const duplicate = await prisma.scrimmageRegistration.findFirst({
    where: {
      fingerprint,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Такая заявка уже зарегистрирована." },
      { status: 409 },
    );
  }

  try {
    const record = await prisma.scrimmageRegistration.create({
      data: {
        teamName: payload.teamName,
        teamNumber: payload.teamNumber || null,
        school: payload.school,
        city: "Астана",
        captainName: payload.captainName,
        phone: payload.phone,
        email: payload.email || null,
        memberCount: payload.memberCount,
        ftcExperience: "unspecified",
        robotStatus: "unspecified",
        testingAreas: [],
        comment: null,
        fingerprint,
      },
      select: { id: true },
    });

    recentFingerprints.set(fingerprint, Date.now());
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось сохранить заявку. Проверьте подключение к базе." },
      { status: 500 },
    );
  }
}
