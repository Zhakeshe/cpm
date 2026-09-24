"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, LogOut, Search, X } from "lucide-react";
import { INVITE_ROLES, inviteRoleLabel } from "@/lib/constants";
import { withBase } from "@/lib/utils";

type Invite = {
  id: string;
  fullName: string;
  grade: string;
  school: string;
  city: string;
  languages: string;
  availability: string;
  heardFrom: string;
  superpower: string;
  phone: string;
  social: string;
  role: string;
  whyJoin: string;
  skills: string;
  portfolio: string | null;
  createdAt: string;
};

export default function AdminInvitesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Invite[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    params.set("sort", sort);
    return params.toString();
  }, [q, role, sort]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(withBase(`/api/admin/invites?${query}`), { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await response.json();
        setRows(data.invites ?? []);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== "AbortError") {
          setError("Could not load applications");
        }
      });
    return () => controller.abort();
  }, [query, router]);

  async function logout() {
    await fetch(withBase("/api/admin/logout"), { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">K.E.R.N School</p>
            <h1 className="text-xl font-semibold text-navy">FTC team applications</h1>
          </div>
          <div className="flex gap-2">
            <a
              href={withBase("/api/admin/invites/export")}
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
        <div className="mx-auto flex max-w-6xl gap-4 px-4 pb-3 text-sm sm:px-6">
          <Link href="/admin" className="text-muted hover:text-navy">
            Scrimmage
          </Link>
          <span className="font-semibold text-navy">Team invites</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search by name, school, phone"
              className="w-full rounded-sm border border-line bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-sm border border-line bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All roles</option>
            {INVITE_ROLES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-navy underline"
          onClick={() => setSort((value) => (value === "desc" ? "asc" : "desc"))}
        >
          Sort by date: {sort === "desc" ? "newest first" : "oldest first"}
        </button>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-4 overflow-x-auto border border-mist bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">School</th>
                <th className="px-3 py-3">Grade</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Social</th>
                <th className="px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted">
                    No applications yet
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-t border-mist hover:bg-paper"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-3 py-3 font-medium text-navy">{row.fullName}</td>
                    <td className="px-3 py-3">{row.school}</td>
                    <td className="px-3 py-3">{row.grade}</td>
                    <td className="px-3 py-3">{inviteRoleLabel(row.role)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{row.phone}</td>
                    <td className="px-3 py-3">{row.social}</td>
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
                <p className="text-xs uppercase tracking-[0.18em] text-gold">Application</p>
                <h2 className="text-xl font-semibold text-navy">{selected.fullName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-sm border border-mist p-2"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Grade" value={selected.grade} />
              <Row label="Languages" value={selected.languages} />
              <Row label="Role" value={inviteRoleLabel(selected.role)} />
              <Row label="Phone" value={selected.phone} />
              <Row label="Social" value={selected.social} />
              <Row
                label="Date"
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
      <dd className="font-medium whitespace-pre-wrap text-navy">{value}</dd>
    </div>
  );
}
