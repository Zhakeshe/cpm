"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.get("token"), password }),
    });
    if (res.ok) router.push("/login");
  }
  return (
    <form onSubmit={onSubmit} className="card w-full max-w-md p-8 space-y-4">
      <div className="text-xl font-semibold">Новый пароль</div>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="w-full rounded-xl bg-[#2563eb] py-3">Сохранить</button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Suspense>
        <Inner />
      </Suspense>
    </div>
  );
}
