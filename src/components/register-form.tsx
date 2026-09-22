"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { MEMBER_COUNTS } from "@/lib/constants";
import {
  formatPhoneMask,
  registrationSchema,
  type RegistrationInput,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { ScoutTeam } from "@/lib/scout";

const fieldClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-gold/35";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-700">{message}</p>;
}

export function RegisterForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ScoutTeam[]>([]);
  const [looking, setLooking] = useState(false);
  const [scoutNote, setScoutNote] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema) as never,
    defaultValues: {
      teamName: "",
      teamNumber: "",
      school: "",
      captainName: "",
      phone: "+7 ",
      email: "",
      memberCount: undefined,
    },
  });

  const teamNumber = watch("teamNumber") ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1" || sessionStorage.getItem("kern-registered") === "1") {
      setSuccess(true);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setMatches([]);
      setLooking(false);
      return;
    }
    const handle = window.setTimeout(async () => {
      setLooking(true);
      try {
        const response = await fetch(`/api/teams/lookup?q=${encodeURIComponent(q)}`);
        const data = (await response.json()) as { teams?: ScoutTeam[] };
        setMatches(data.teams ?? []);
      } catch {
        setMatches([]);
      } finally {
        setLooking(false);
      }
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setMatches([]);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pickTeam(team: ScoutTeam) {
    setValue("teamNumber", String(team.number), { shouldValidate: true });
    setValue("teamName", team.name, { shouldValidate: true });
    if (team.schoolName && team.schoolName !== "Unknown") {
      setValue("school", team.schoolName, { shouldValidate: true });
    }
    setQuery(`${team.number} · ${team.name}`);
    setMatches([]);
    setScoutNote("Карточка из FTCScout. Школу проверьте, если она указана неверно.");
  }

  async function onSubmit(values: RegistrationInput) {
    setServerError(null);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setServerError(data.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }
    sessionStorage.setItem("kern-registered", "1");
    window.history.replaceState({}, "", "/?registered=1#register");
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-[0_20px_60px_rgba(6,45,89,0.08)] sm:px-10">
        <CheckCircle2 className="mx-auto text-gold" size={36} />
        <h3 className="mt-4 text-2xl font-semibold text-navy">Заявка отправлена</h3>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">
          Напишем капитану в WhatsApp, когда подтвердим участие.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
          onClick={() => {
            sessionStorage.removeItem("kern-registered");
            window.history.replaceState({}, "", "/");
            setSuccess(false);
          }}
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(6,45,89,0.08)] sm:p-8"
      noValidate
    >
      <div ref={boxRef} className="relative">
        <label className="block text-sm font-medium text-navy">
          Найти в FTCScout
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={fieldClass}
            placeholder="Номер или название, например 11115"
            autoComplete="off"
          />
        </label>
        {looking ? <p className="mt-1.5 text-xs text-muted">Ищем…</p> : null}
        {matches.length > 0 ? (
          <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-navy/10 bg-white shadow-lg">
            {matches.map((team) => (
              <li key={team.number}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start px-3.5 py-2.5 text-left text-sm hover:bg-paper"
                  onClick={() => pickTeam(team)}
                >
                  <span className="font-medium text-navy">
                    {team.number} · {team.name}
                  </span>
                  <span className="text-xs text-muted">
                    {[team.schoolName, team.city, team.country].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {scoutNote ? <p className="mt-1.5 text-xs text-muted">{scoutNote}</p> : null}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Номер FTC
          <input
            {...register("teamNumber")}
            className={fieldClass}
            placeholder="если ещё нет — оставьте пустым"
            value={teamNumber}
            onChange={(event) => {
              const value = event.target.value;
              setValue("teamNumber", value, { shouldValidate: true });
              setQuery(value);
            }}
          />
          <FieldError message={errors.teamNumber?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Название команды
          <input {...register("teamName")} className={fieldClass} placeholder="KERN Robotics" />
          <FieldError message={errors.teamName?.message} />
        </label>
        <label className="block text-sm font-medium text-navy sm:col-span-2">
          Школа
          <input {...register("school")} className={fieldClass} />
          <FieldError message={errors.school?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Капитан
          <input {...register("captainName")} className={fieldClass} />
          <FieldError message={errors.captainName?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          WhatsApp
          <input
            className={cn(fieldClass, "tracking-wide")}
            inputMode="tel"
            autoComplete="tel"
            {...register("phone", {
              onChange: (event) => {
                const next = formatPhoneMask(event.target.value);
                event.target.value = next;
                setValue("phone", next, { shouldValidate: true });
              },
            })}
          />
          <FieldError message={errors.phone?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Email
          <input {...register("email")} className={fieldClass} type="email" placeholder="необязательно" />
          <FieldError message={errors.email?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Участников
          <select {...register("memberCount")} className={fieldClass} defaultValue="">
            <option value="" disabled>
              4 или 5
            </option>
            {MEMBER_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          <FieldError message={errors.memberCount?.message} />
        </label>
      </div>

      {serverError ? <p className="mt-4 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : null}
        {isSubmitting ? "Отправка..." : "Отправить заявку"}
      </button>
    </form>
  );
}
