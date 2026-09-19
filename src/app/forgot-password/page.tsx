"use client";

import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDone(true);
  }
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8 space-y-4">
        <div className="text-xl font-semibold">Восстановление пароля</div>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="w-full rounded-xl bg-[#2563eb] py-3">Отправить ссылку</button>
        {done && <div className="text-sm text-[#34d399]">Если аккаунт существует, инструкция отправлена.</div>}
      </form>
    </div>
  );
}
