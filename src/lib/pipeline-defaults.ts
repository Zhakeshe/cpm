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
  { slug: "contacted", name: "Первый контакт", order: 2, requiredFields: [] },
  { slug: "callback", name: "Перезвонить", order: 3, requiredFields: [] },
  { slug: "demo", name: "Запись на демо", order: 4, requiredFields: [] },
  { slug: "demo_done", name: "Демо проведено", order: 5, requiredFields: [] },
  { slug: "thinking", name: "КП / думает", order: 6, requiredFields: ["dealAmount"] },
  { slug: "paid", name: "Оплатил", order: 7, isWon: true, requiredFields: ["dealAmount"] },
  { slug: "lost", name: "Отказ", order: 8, isLost: true, requiredFields: [] },
];

export const MANAGER_BLOCKED_PATHS = [
  "/settings",
  "/audit",
  "/monitoring",
  "/managers",
  "/sla",
  "/catalog",
  "/companies",
  "/analytics",
];

export function isManagerBlockedPath(pathname: string) {
  return MANAGER_BLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}