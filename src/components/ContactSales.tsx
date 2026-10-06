"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Tag = { id: string; name: string; color: string };

const TAG_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2"];

function tagColor(tag: Tag) {
  if (tag.color && tag.color.toLowerCase() !== "#2563eb") return tag.color;
  const hash = Array.from(tag.name).reduce((total, character) => total + character.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

export function ContactSales({
  contactId,
  tags,
  onChange,
}: {
  contactId: string;
  tags: Array<{ tag: Tag }>;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setAllTags);
  }, []);

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-2">
        <div className="font-medium">{t("contact.tags")}</div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const on = tags.some((x) => x.tag.id === tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className="rounded-full border px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: on ? tagColor(tag) : "transparent",
                  borderColor: tagColor(tag),
                  color: on ? "#ffffff" : tagColor(tag),
                }}
                onClick={() =>
                  fetch("/api/tags", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contactId, tagId: tag.id, remove: on }),
                  }).then(onChange)
                }
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
