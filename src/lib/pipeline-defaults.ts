export type VacuumStageDef = {
  slug: string;
  name: string;
  order: number;
  isWon?: boolean;
  isLost?: boolean;
  requiredFields: string[];
};

/** Пелесос сату воронкасы — лид → демо → КП → төлем / бас тарту. */
export const VACUUM_PIPELINE_STAGES: VacuumStageDef[] = [
  { slug: "new", name: "Новый лид", order: 1, requiredFields: [] },
  { slug: "not_needed", name: "Керек Емес", order: 2, requiredFields: [] },
  { slug: "contacted", name: "ТНБ", order: 3, requiredFields: [] },
  { slug: "demo", name: "Демо Бүгінге", order: 4, requiredFields: [] },
  { slug: "demo_done", name: "Демо Ертеңге", order: 5, requiredFields: [] },
  { slug: "callback", name: "Патом звонда", order: 6, requiredFields: [] },
  { slug: "thinking", name: "Ойланамын", order: 7, requiredFields: ["dealAmount"] },
  { slug: "paid", name: "Оплатил", order: 8, isWon: true, requiredFields: ["dealAmount"] },
  { slug: "lost", name: "Отказ", order: 9, isLost: true, requiredFields: [] },
];

export const MANAGER_BLOCKED_PATHS = [
  "/settings",
  "/audit",
  "/monitoring",
  "/managers",
  "/sla",
  "/catalog",
  "/companies",
  "/calls",
  "/analytics",
];

export function isManagerBlockedPath(pathname: string) {
  return MANAGER_BLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
