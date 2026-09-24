"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { AVAILABILITY, HEARD_FROM, INVITE_ROLE_IDS } from "@/lib/invite-copy";
import { formatPhoneMask, inviteSchema, type InviteInput } from "@/lib/validation";
import { cn, withBase } from "@/lib/utils";
import { useInviteLang } from "@/components/invite-i18n";

const fieldClass =
  "invite-field";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-700">{message}</p>;
}

export function InviteForm() {
  const { t } = useInviteLang();
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
      city: "Астана",
      languages: "",
      phone: "+7 ",
      social: "",
      role: undefined,
      availability: undefined,
      heardFrom: undefined,
      superpower: "",
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
      setServerError(
        data.error === "We already have this application."
          ? t.errors.duplicate
          : data.error?.includes("just sent")
            ? t.errors.wait
            : t.errors.server,
      );
      return;
    }
    sessionStorage.setItem("kern-invite", "1");
    window.history.replaceState({}, "", `${withBase("/invite")}?applied=1#apply`);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="invite-success">
        <CheckCircle2 className="mx-auto text-[var(--invite-gold)]" size={36} />
        <h3>{t.successTitle}</h3>
        <p>{t.successText}</p>
        <button
          type="button"
          className="invite-btn-gold mt-8"
          onClick={() => {
            sessionStorage.removeItem("kern-invite");
            window.history.replaceState({}, "", withBase("/invite"));
            setSuccess(false);
          }}
        >
          {t.another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="invite-form" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          {t.fields.fullName}
          <input {...register("fullName")} className={fieldClass} autoComplete="name" />
          <FieldError message={errors.fullName ? t.errors.fullName : undefined} />
        </label>
        <label>
          {t.fields.grade}
          <input {...register("grade")} className={fieldClass} placeholder="10A" />
          <FieldError message={errors.grade ? t.errors.grade : undefined} />
        </label>
        <label>
          {t.fields.city}
          <input {...register("city")} className={fieldClass} />
          <FieldError message={errors.city ? t.errors.city : undefined} />
        </label>
        <label>
          {t.fields.languages}
          <input {...register("languages")} className={fieldClass} placeholder="ҚАЗ / РУС / ENG" />
          <FieldError message={errors.languages ? t.errors.languages : undefined} />
        </label>
        <label>
          {t.fields.phone}
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
          <FieldError message={errors.phone ? t.errors.phone : undefined} />
        </label>
        <label>
          {t.fields.social}
          <input {...register("social")} className={fieldClass} placeholder="@username" />
          <FieldError message={errors.social ? t.errors.social : undefined} />
        </label>
        <label>
          {t.fields.role}
          <select {...register("role")} className={fieldClass} defaultValue="">
            <option value="" disabled>
              {t.fields.rolePlaceholder}
            </option>
            {INVITE_ROLE_IDS.map((id) => (
              <option key={id} value={id}>
                {t.roles[id].title}
              </option>
            ))}
          </select>
          <FieldError message={errors.role ? t.errors.role : undefined} />
        </label>
        <label>
          {t.fields.availability}
          <select {...register("availability")} className={fieldClass} defaultValue="">
            <option value="" disabled>
              {t.fields.availabilityPlaceholder}
            </option>
            {AVAILABILITY.map((id) => (
              <option key={id} value={id}>
                {t.availabilityOpts[id]}
              </option>
            ))}
          </select>
          <FieldError message={errors.availability ? t.errors.availability : undefined} />
        </label>
        <label className="sm:col-span-2">
          {t.fields.heardFrom}
          <select {...register("heardFrom")} className={fieldClass} defaultValue="">
            <option value="" disabled>
              {t.fields.heardPlaceholder}
            </option>
            {HEARD_FROM.map((id) => (
              <option key={id} value={id}>
                {t.heardOpts[id]}
              </option>
            ))}
          </select>
          <FieldError message={errors.heardFrom ? t.errors.heardFrom : undefined} />
        </label>
        <label className="sm:col-span-2">
          {t.fields.superpower}
          <textarea {...register("superpower")} className={cn(fieldClass, "min-h-24 resize-y")} rows={3} />
          <FieldError message={errors.superpower ? t.errors.superpower : undefined} />
        </label>
        <label className="sm:col-span-2">
          {t.fields.whyJoin}
          <textarea {...register("whyJoin")} className={cn(fieldClass, "min-h-28 resize-y")} rows={4} />
          <FieldError message={errors.whyJoin ? t.errors.whyJoin : undefined} />
        </label>
        <label className="sm:col-span-2">
          {t.fields.skills}
          <textarea {...register("skills")} className={cn(fieldClass, "min-h-28 resize-y")} rows={4} />
          <FieldError message={errors.skills ? t.errors.skills : undefined} />
        </label>
        <label className="sm:col-span-2">
          {t.fields.portfolio}
          <span className="ml-2 text-[11px] font-normal tracking-normal text-[var(--invite-mute)]">
            {t.fields.portfolioHint}
          </span>
          <input {...register("portfolio")} className={fieldClass} />
          <FieldError message={errors.portfolio ? t.errors.portfolio : undefined} />
        </label>
      </div>

      {serverError ? <p className="mt-4 text-sm text-red-700">{serverError}</p> : null}

      <button type="submit" disabled={isSubmitting} className="invite-btn-gold mt-8 w-full sm:w-auto">
        {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : null}
        {isSubmitting ? t.sending : t.submit}
      </button>
    </form>
  );
}
