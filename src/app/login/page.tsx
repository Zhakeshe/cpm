"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@crm.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error === "ACCOUNT_DISABLED" ? "Аккаунт отключён" : "Неверный логин или пароль");
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8 space-y-4">
        <div>
          <div className="text-2xl font-semibold">Amanat CRM</div>
          <div className="muted text-sm mt-1">Вход для отдела продаж</div>
        </div>
        <label className="block text-sm">
          Email / логин
          <input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          Пароль
          <input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="text-[#f87171] text-sm">{error}</div>}
        <button className="w-full rounded-xl bg-[#2563eb] py-3 font-medium">Войти</button>
        <Link href="/forgot-password" className="block text-center text-sm muted">
          Восстановить пароль
        </Link>
      </form>
    </div>
  );
}
