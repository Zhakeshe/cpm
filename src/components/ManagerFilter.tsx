"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

export type ManagerOption = { id: string; name: string; role: string };

export function useManagers() {
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) =>
        setManagers(
          Array.isArray(data) ? data.filter((u: ManagerOption) => u.role === "MANAGER" || u.role === "OPERATOR") : [],
        ),
      );
  }, []);
  return managers;
}

export function ManagerFilter({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { t } = useI18n();
  const managers = useManagers();
  if (managers.length < 2) return null;
  return (
    <label className="text-xs muted">
      {t("common.manager")}
      <select className="mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t("common.manager")}</option>
        {managers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}
