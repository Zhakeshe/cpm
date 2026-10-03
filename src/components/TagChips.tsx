"use client";

type Tag = { id: string; name: string; color: string };

export function TagChips({
  tags,
  selectedIds,
  onToggle,
}: {
  tags: Tag[];
  selectedIds: string[];
  onToggle?: (tag: Tag, on: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const on = selectedIds.includes(tag.id);
        if (!on && !onToggle) return null;
        const style = on ? { background: tag.color, color: "#fff" } : undefined;
        if (!onToggle) {
          return (
            <span key={tag.id} className="chip text-xs" style={style}>
              {tag.name}
            </span>
          );
        }
        return (
          <button key={tag.id} type="button" className="chip text-xs" style={style} onClick={() => onToggle(tag, on)}>
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
