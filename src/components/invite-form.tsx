"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { INVITE_ROLES } from "@/lib/constants";
import { formatPhoneMask, inviteSchema, type InviteInput } from "@/lib/validation";
import { cn, withBase } from "@/lib/utils";

const fieldClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-gold/35";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-700">{message}</p>;
}

export function InviteForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema) as never,
    defaultValues: {
      fullName: "",
      grade: "",
      phone: "+7 ",
      social: "",
      role: undefined,
      whyJoin: "",
      skills: "",
      portfolio: "",
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("applied") === "1" || sessionStorage.getItem("kern-invite") === "1") {
      setSuccess(true);
    }
  }, []);

  async function onSubmit(values: InviteInput) {
    setServerError(null);
    const response = await fetch(withBase("/api/invite"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setServerError(data.error || "Could not send the application. Try again.");
      return;
    }
    sessionStorage.setItem("kern-invite", "1");
    window.history.replaceState({}, "", `${withBase("/invite")}?applied=1#apply`);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-[0_20px_60px_rgba(6,45,89,0.08)] sm:px-10">
        <CheckCircle2 className="mx-auto text-gold" size={36} />
        <h3 className="mt-4 text-2xl font-semibold text-navy">Application sent</h3>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">
          We will write you on Instagram or Telegram after we review the form.
        </p>
        <button
          type="button"
          className="mt-8 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
          onClick={() => {
            sessionStorage.removeItem("kern-invite");
            window.history.replaceState({}, "", withBase("/invite"));
            setSuccess(false);
          }}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(6,45,89,0.08)] sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy sm:col-span-2">
          Full Name
          <input {...register("fullName")} className={fieldClass} autoComplete="name" />
          <FieldError message={errors.fullName?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Grade / Class
          <input {...register("grade")} className={fieldClass} placeholder="10A" />
          <FieldError message={errors.grade?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Phone number
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
          Instagram or Telegram
          <input {...register("social")} className={fieldClass} placeholder="@username" />
          <FieldError message={errors.social?.message} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Role of interest
          <select {...register("role")} className={fieldClass} defaultValue="">
            <option value="" disabled>
              Choose a role
            </option>
            {INVITE_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.title}
              </option>
            ))}
          </select>
          <FieldError message={errors.role?.message} />
        </label>
        <label className="block text-sm font-medium text-navy sm:col-span-2">
          Why do you want to join?
          <textarea {...register("whyJoin")} className={cn(fieldClass, "min-h-28 resize-y")} rows={4} />
          <FieldError message={errors.whyJoin?.message} />
        </label>
        <label className="block text-sm font-medium text-navy sm:col-span-2">
          Your skills / experience
          <textarea {...register("skills")} className={cn(fieldClass, "min-h-28 resize-y")} rows={4} />
          <FieldError message={errors.skills?.message} />
        </label>
        <label className="block text-sm font-medium text-navy sm:col-span-2">
          Link to portfolio or works
          <input
            {...register("portfolio")}
            className={fieldClass}
            placeholder="optional — URL or @username"
          />
          <FieldError message={errors.portfolio?.message} />
        </label>
      </div>

      {serverError ? <p className="mt-4 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : null}
        {isSubmitting ? "Sending..." : "Submit Application"}
      </button>
    </form>
  );
}
