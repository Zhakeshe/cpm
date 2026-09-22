import { NextRequest, NextResponse } from "next/server";
import type { ScoutTeam } from "@/lib/scout";

function asTeam(raw: unknown): ScoutTeam | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.number !== "number" || typeof row.name !== "string") return null;
  return {
    number: row.number,
    name: row.name,
    schoolName: typeof row.schoolName === "string" ? row.schoolName : null,
    city: typeof row.city === "string" ? row.city : null,
    country: typeof row.country === "string" ? row.country : null,
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 48) {
    return NextResponse.json({ teams: [] });
  }

  const teams: ScoutTeam[] = [];
  const seen = new Set<number>();

  const add = (team: ScoutTeam | null) => {
    if (!team || seen.has(team.number)) return;
    seen.add(team.number);
    teams.push(team);
  };

  const compact = q.replace(/\s/g, "");
  try {
    if (/^\d{3,6}$/.test(compact)) {
      add(asTeam(await fetchJson(`https://api.ftcscout.org/rest/v1/teams/${compact}`)));
    }

    const search = await fetchJson(
      `https://api.ftcscout.org/rest/v1/teams/search?limit=8&searchText=${encodeURIComponent(q)}`,
    );
    if (Array.isArray(search)) {
      for (const item of search) add(asTeam(item));
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось получить данные FTCScout" },
      { status: 502 },
    );
  }

  return NextResponse.json({ teams: teams.slice(0, 8) });
}
