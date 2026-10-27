"use client";

import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/lib/bookmarks";

export function BookmarkButton({
  id,
  name,
  variant = "icon",
  className = "",
}: {
  id: string;
  name: string;
  variant?: "icon" | "labelled";
  className?: string;
}) {
  const { has, toggle } = useBookmarks();
  const saved = has(id);
  const label = saved ? `Remove ${name} from bookmarks` : `Bookmark ${name}`;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={`inline-flex items-center gap-2 transition-colors ${saved ? "text-crimson-bright" : "text-bone-dim hover:text-bone"} ${className}`}
    >
      <Bookmark className="size-[18px]" fill={saved ? "currentColor" : "none"} />
      {variant === "labelled" && <span className="label">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
