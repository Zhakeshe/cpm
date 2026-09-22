import { z } from "zod";
import { MEMBER_COUNTS } from "./constants";

export const PHONE_REGEX = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;

export const registrationSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(2, "Укажите название команды")
    .max(80, "Слишком длинное название"),
  teamNumber: z.string().trim().max(20, "Слишком длинный номер").optional(),
  school: z
    .string({ required_error: "Укажите название школы" })
    .trim()
    .min(2, "Укажите название школы")
    .max(120, "Слишком длинное название школы"),
  captainName: z
    .string({ required_error: "Укажите имя и фамилию капитана" })
    .trim()
    .min(3, "Укажите имя и фамилию капитана")
    .max(80, "Слишком длинное имя"),
  phone: z
    .string({ required_error: "Введите номер в формате +7 XXX XXX XX XX" })
    .trim()
    .regex(PHONE_REGEX, "Введите номер в формате +7 XXX XXX XX XX"),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Некорректный email",
    }),
  memberCount: z.coerce
    .number({ invalid_type_error: "Выберите количество участников" })
    .refine((value) => MEMBER_COUNTS.includes(value as 4 | 5), {
      message: "Команда должна состоять из 4 или 5 участников",
    }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function formatPhoneMask(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("7")
    ? digits.slice(1, 11)
    : digits.startsWith("8")
      ? digits.slice(1, 11)
      : digits.slice(0, 10);

  let result = "+7";
  if (local.length > 0) result += ` ${local.slice(0, 3)}`;
  if (local.length > 3) result += ` ${local.slice(3, 6)}`;
  if (local.length > 6) result += ` ${local.slice(6, 8)}`;
  if (local.length > 8) result += ` ${local.slice(8, 10)}`;
  return result;
}
