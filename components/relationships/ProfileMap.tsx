"use client";

import { useState } from "react";
import type { ArtMap } from "@/lib/art";
import type { Category } from "@/lib/relations";
import { allCategories, RelationshipMap } from "./RelationshipMap";

export function ProfileMap({ focusId, art }: { focusId: string; art: ArtMap }) {
  const [active, setActive] = useState<Set<Category>>(allCategories);
  return (
    <RelationshipMap
      focusId={focusId}
      art={art}
      mode="profile"
      active={active}
      onToggleCategory={(c) =>
        setActive((s) => {
          const next = new Set(s);
          if (next.has(c)) next.delete(c);
          else next.add(c);
          return next;
        })
      }
    />
  );
}
