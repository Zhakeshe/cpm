import { z } from "zod";
import { INVITE_ROLES, MEMBER_COUNTS } from "./constants";

const INVITE_ROLE_VALUES = INVITE_ROLES.map((role) => role.value) as [
  (typeof INVITE_ROLES)[number]["value"],
  ...(typeof INVITE_ROLES)[number]["value"][],
];

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

export const inviteSchema = z.object({
  fullName: z
    .string({ required_error: "Enter your full name" })
    .trim()
    .min(3, "Enter your full name")
    .max(80, "Name is too long"),
  grade: z
    .string({ required_error: "Enter your grade or class" })
    .trim()
    .min(1, "Enter your grade or class")
    .max(40, "Too long"),
  phone: z
    .string({ required_error: "Enter a number as +7 XXX XXX XX XX" })
    .trim()
    .regex(PHONE_REGEX, "Enter a number as +7 XXX XXX XX XX"),
  social: z
    .string({ required_error: "Add Instagram or Telegram" })
    .trim()
    .min(2, "Add Instagram or Telegram")
    .max(80, "Too long"),
  role: z.enum(INVITE_ROLE_VALUES, {
    required_error: "Choose a role",
    invalid_type_error: "Choose a role",
  }),
  whyJoin: z
    .string({ required_error: "Tell us why you want to join" })
    .trim()
    .min(10, "Write at least a couple of sentences")
    .max(800, "Keep it under 800 characters"),
  skills: z
    .string({ required_error: "Describe your skills" })
    .trim()
    .min(8, "Describe your skills")
    .max(800, "Keep it under 800 characters"),
  portfolio: z
    .string()
    .trim()
    .max(240, "Link is too long")
    .optional()
    .refine(
      (value) =>
        !value ||
        /^https?:\/\//i.test(value) ||
        value.startsWith("@") ||
        value.startsWith("t.me/") ||
        value.startsWith("instagram.com/"),
      { message: "Add a link or @username" },
    ),
});

export type InviteInput = z.infer<typeof inviteSchema>;

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
