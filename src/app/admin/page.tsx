"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Search, X } from "lucide-react";

type Registration = {
  id: string;
  teamName: string;
  teamNumber: string | null;
  school: string;
  captainName: string;
  phone: string;
  email: string | null;
  memberCount: number;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Registration[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [school, setSchool] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (school) params.set("school", school);
    params.set("sort", sort);
    return params.toString();
  }, [q, school, sort]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/registrations?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await response.json();
        setRows(data.registrations ?? []);
        setSchools(data.schools ?? []);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== "AbortError") {
          setError("Не удалось загрузить заявки");
        }
      });
    return () => controller.abort();
  }, [query, router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">K.E.R.N School</p>
            <h1 className="text-xl font-semibold text-navy">Заявки FTC Scrimmage</h1>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/admin/export"
              className="inline-flex items-center gap-2 rounded-sm border border-mist px-3 py-2 text-sm text-navy"
            >
              <Download size={16} /> CSV
            </a>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-sm bg-navy px-3 py-2 text-sm text-white"
            >
              <LogOut size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Поиск по команде, номеру, капитану"
              className="w-full rounded-sm border border-line bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <select
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            className="rounded-sm border border-line bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Все школы</option>
            {schools.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-navy underline"
          onClick={() => setSort((value) => (value === "desc" ? "asc" : "desc"))}
        >
          Сортировка по дате: {sort === "desc" ? "новые сначала" : "старые сначала"}
        </button>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-4 overflow-x-auto border border-mist bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-3">Team</th>
                <th className="px-3 py-3">FTC Number</th>
                <th className="px-3 py-3">School</th>
                <th className="px-3 py-3">Captain</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Members</th>
                <th className="px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted">
                    Заявок пока нет
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-t border-mist hover:bg-paper"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-3 py-3 font-medium text-navy">{row.teamName}</td>
                    <td className="px-3 py-3">{row.teamNumber || "—"}</td>
                    <td className="px-3 py-3">{row.school}</td>
                    <td className="px-3 py-3">{row.captainName}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{row.phone}</td>
                    <td className="px-3 py-3">{row.memberCount}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("ru-KZ")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end bg-navy/40 p-0 sm:items-center sm:p-6">
          <div className="max-h-[90vh] w-full overflow-y-auto bg-white p-6 sm:mx-auto sm:max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">Заявка</p>
                <h2 className="text-xl font-semibold text-navy">{selected.teamName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-sm border border-mist p-2"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="FTC Number" value={selected.teamNumber || "—"} />
              <Row label="Школа" value={selected.school} />
              <Row label="Капитан" value={selected.captainName} />
              <Row label="WhatsApp" value={selected.phone} />
              <Row label="Email" value={selected.email || "—"} />
              <Row label="Участники" value={String(selected.memberCount)} />
              <Row
                label="Дата"
                value={new Date(selected.createdAt).toLocaleString("ru-KZ")}
              />
            </dl>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-mist pb-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}
