import type { Category, Slot } from "@/lib/relations";

/** Line colour + dash per category. Style carries as much meaning as colour. */
export const lineStyle: Record<Category, { color: string; dash?: string; width: number }> = {
  family: { color: "var(--rel-family)", width: 1.4 },
  mentor: { color: "var(--rel-mentor)", dash: "7 5", width: 1.3 },
  ally: { color: "var(--rel-ally)", dash: "1 5", width: 1.8 },
  romance: { color: "var(--rel-romance)", dash: "12 4 2 4", width: 1.3 },
  rival: { color: "var(--rel-rival)", width: 1.6 },
  lineage: { color: "var(--rel-lineage)", dash: "3 3", width: 1.3 },
};

export const slotCategory: Record<Slot, Category> = {
  family: "family",
  mentors: "mentor",
  allies: "ally",
  romance: "romance",
  rivals: "rival",
  next: "lineage",
};

export function Swatch({ category, className = "w-8" }: { category: Category; className?: string }) {
  const s = lineStyle[category];
  return (
    <svg aria-hidden viewBox="0 0 32 6" className={`h-1.5 shrink-0 ${className}`}>
      <line
        x1="1"
        y1="3"
        x2="31"
        y2="3"
        stroke={s.color}
        strokeWidth={s.width + 0.4}
        strokeDasharray={s.dash}
        strokeLinecap="round"
      />
    </svg>
  );
}
