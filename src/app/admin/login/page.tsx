"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { withBase } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch(withBase("/api/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Ошибка входа");
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-mist bg-white p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Организаторы
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-navy">Вход в admin</h1>
        <label className="mt-6 block text-sm font-medium text-navy">
          Пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-sm border border-line px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            autoFocus
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-sm bg-navy py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Проверка..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
