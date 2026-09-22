"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import Link from "next/link";
import {
  FTC_EXPERIENCE,
  MEMBER_COUNTS,
  ROBOT_STATUS,
  TESTING_AREAS,
} from "@/lib/constants";
import {
  formatPhoneMask,
  registrationSchema,
  type RegistrationInput,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1.5 w-full rounded-sm border border-line bg-white px-3 py-2.5 text-sm text-ink transition hover:border-navy/30 focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/40";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-700">{message}</p>;
}

export function RegisterForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
      city: "Астана",
      captainName: "",
      phone: "+7 ",
      email: "",
      memberCount: undefined,
      ftcExperience: undefined,
      robotStatus: undefined,
      testingAreas: [],
      comment: "",
      confirm: false,
    },
  });

  const comment = watch("comment") ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1" || sessionStorage.getItem("kern-registered") === "1") {
      setSuccess(true);
    }
  }, []);

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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-mist bg-white px-6 py-12 text-center sm:px-10"
      >
        <CheckCircle2 className="mx-auto text-gold" size={40} />
        <h3 className="mt-4 text-2xl font-semibold text-navy">Заявка отправлена!</h3>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          Спасибо за регистрацию на K.E.R.N FTC Scrimmage.
          Организаторы свяжутся с капитаном команды через WhatsApp
          для подтверждения участия и отправки дальнейшей информации.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-sm bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-mid"
          onClick={() => {
            sessionStorage.removeItem("kern-registered");
            window.history.replaceState({}, "", "/");
            setSuccess(false);
          }}
        >
          Вернуться на главную
        </Link>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border border-mist bg-white p-5 sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Название команды
          <input
            {...register("teamName")}
            className={fieldClass}
            placeholder="KERN Robotics"
          />
          <FieldError message={errors.teamName?.message} />
        </label>

        <label className="block text-sm font-medium text-navy">
          FTC Team Number
          <input
            {...register("teamNumber")}
            className={fieldClass}
            placeholder="Например, 12345"
          />
          <FieldError message={errors.teamNumber?.message} />
        </label>

        <label className="block text-sm font-medium text-navy">
          Название школы
          <input {...register("school")} className={fieldClass} />
          <FieldError message={errors.school?.message} />
        </label>

        <label className="block text-sm font-medium text-navy">
          Город
          <input {...register("city")} className={fieldClass} />
          <FieldError message={errors.city?.message} />
        </label>

        <label className="block text-sm font-medium text-navy">
          Имя и фамилия капитана
          <input {...register("captainName")} className={fieldClass} />
          <FieldError message={errors.captainName?.message} />
        </label>

        <label className="block text-sm font-medium text-navy">
          WhatsApp номер
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
          Email капитана
          <input
            {...register("email")}
            className={fieldClass}
            type="email"
            placeholder="необязательно"
          />
          <FieldError message={errors.email?.message} />
        </label>

        <label className="block text-sm font-medium text-navy">
          Количество участников
          <select {...register("memberCount")} className={fieldClass} defaultValue="">
            <option value="" disabled>
              Выберите
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

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-navy">Опыт команды в FTC</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {FTC_EXPERIENCE.map((item) => (
            <label
              key={item.value}
              className="flex cursor-pointer items-center gap-2 border border-mist px-3 py-2.5 text-sm"
            >
              <input
                type="radio"
                value={item.value}
                {...register("ftcExperience")}
                className="accent-navy"
              />
              {item.label}
            </label>
          ))}
        </div>
        <FieldError message={errors.ftcExperience?.message} />
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-navy">Есть ли готовый робот?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ROBOT_STATUS.map((item) => (
            <label
              key={item.value}
              className="flex cursor-pointer items-center gap-2 border border-mist px-3 py-2.5 text-sm"
            >
              <input
                type="radio"
                value={item.value}
                {...register("robotStatus")}
                className="accent-navy"
              />
              {item.label}
            </label>
          ))}
        </div>
        <FieldError message={errors.robotStatus?.message} />
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-navy">
          Что команда хочет протестировать?
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {TESTING_AREAS.map((item) => (
            <label
              key={item.value}
              className="flex cursor-pointer items-center gap-2 border border-mist px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                value={item.value}
                {...register("testingAreas")}
                className="accent-navy"
              />
              {item.label}
            </label>
          ))}
        </div>
        <FieldError message={errors.testingAreas?.message} />
      </fieldset>

      <label className="mt-6 block text-sm font-medium text-navy">
        Дополнительный комментарий
        <textarea
          {...register("comment")}
          rows={4}
          maxLength={500}
          className={cn(fieldClass, "resize-y")}
        />
        <span className="mt-1 block text-xs text-muted">{comment.length}/500</span>
        <FieldError message={errors.comment?.message} />
      </label>

      <label className="mt-6 flex items-start gap-3 text-sm text-navy">
        <input type="checkbox" {...register("confirm")} className="mt-0.5 accent-navy" />
        <span>Я подтверждаю корректность указанных данных.</span>
      </label>
      <FieldError message={errors.confirm?.message} />

      {serverError ? <p className="mt-4 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-navy px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : null}
        {isSubmitting ? "Отправка..." : "Отправить заявку"}
      </button>
    </form>
  );
}
