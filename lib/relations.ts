import { relationships } from "@/data/relationships";
import type { Character, Relationship } from "@/data/types";
import { requireCharacter } from "./data";

/** Visual encoding of a link: colour + line style in the legend. */
export type Category = "family" | "mentor" | "ally" | "romance" | "rival" | "lineage";

/** Where a group sits around the focus on the map. */
export type Slot = "family" | "mentors" | "allies" | "romance" | "rivals" | "next";

export const categories: { id: Category; label: string }[] = [
  { id: "family", label: "Family" },
  { id: "mentor", label: "Mentor & guidance" },
  { id: "ally", label: "Ally & friend" },
  { id: "romance", label: "Love & marriage" },
  { id: "rival", label: "Rival & enemy" },
  { id: "lineage", label: "Children & descendants" },
];

export const slotLabels: Record<Slot, string> = {
  family: "Family",
  mentors: "Mentors",
  allies: "Allies",
  romance: "Love & marriage",
  rivals: "Rivals",
  next: "Next generation",
};

export interface Link {
  person: Character;
  /** What `person` is to the focus, e.g. "Uncle" or "Mentor". */
  role: string;
  category: Category;
  note?: string;
}

export type Groups = Record<Slot, Link[]>;

const touching = (id: string) => relationships.filter((r) => r.from === id || r.to === id);

/** The other end of an edge and the role that person plays for `focus`. */
function other(r: Relationship, focus: string) {
  return r.to === focus ? { id: r.from, role: r.fromRole } : { id: r.to, role: r.toRole };
}

export function parentsOf(id: string) {
  return relationships
    .filter((r) => r.type === "parent" && r.to === id)
    .map((r) => ({ person: requireCharacter(r.from), role: r.fromRole }));
}

export function childrenOf(id: string) {
  return relationships
    .filter((r) => r.type === "parent" && r.from === id)
    .map((r) => ({ person: requireCharacter(r.to), role: r.toRole }));
}

/**
 * Siblings, from explicit edges plus anyone sharing a recorded parent.
 * A shared parent alone gives "half-" only when both have a different
 * second parent on record; otherwise we don't claim to know.
 */
export function siblingsOf(id: string): Link[] {
  const found = new Map<string, Link>();
  for (const r of relationships) {
    if (r.type !== "sibling" || (r.from !== id && r.to !== id)) continue;
    const o = other(r, id);
    found.set(o.id, { person: requireCharacter(o.id), role: o.role, category: "family", note: r.note });
  }
  const myParents = new Set(parentsOf(id).map((p) => p.person.id));
  for (const parent of myParents) {
    for (const { person } of childrenOf(parent)) {
      if (person.id === id || found.has(person.id)) continue;
      const theirParents = new Set(parentsOf(person.id).map((p) => p.person.id));
      const half =
        [...myParents].some((p) => !theirParents.has(p)) && [...theirParents].some((p) => !myParents.has(p));
      const word = person.gender === "f" ? "sister" : "brother";
      found.set(person.id, {
        person,
        role: half ? `Half-${word}` : word[0].toUpperCase() + word.slice(1),
        category: "family",
      });
    }
  }
  return [...found.values()];
}

/**
 * Everything around one character, grouped into the six map slots.
 * The same person can appear in two slots (Mario is both uncle and mentor);
 * within a slot they appear once with their roles joined.
 */
export function groupsFor(focus: string): Groups {
  const groups: Groups = { family: [], mentors: [], allies: [], romance: [], rivals: [], next: [] };

  const add = (slot: Slot, link: Link) => {
    const existing = groups[slot].find((l) => l.person.id === link.person.id);
    if (existing) {
      if (!existing.role.includes(link.role)) existing.role += ` · ${link.role}`;
      return;
    }
    groups[slot].push(link);
  };

  for (const p of parentsOf(focus)) add("family", { ...p, category: "family" });
  for (const r of touching(focus).filter((r) => r.type === "relative")) {
    const o = other(r, focus);
    add("family", { person: requireCharacter(o.id), role: o.role, category: "family", note: r.note });
  }
  for (const s of siblingsOf(focus)) add("family", s);

  for (const r of touching(focus)) {
    const o = other(r, focus);
    const person = requireCharacter(o.id);
    const link = (category: Category): Link => ({ person, role: o.role, category, note: r.note });
    const incoming = r.to === focus;

    switch (r.type) {
      case "spouse":
      case "romance":
        add("romance", link("romance"));
        break;
      case "mentor":
        add(incoming ? "mentors" : "next", link("mentor"));
        break;
      case "legacy":
        add(incoming ? "mentors" : "next", link("mentor"));
        break;
      case "ally":
        add("allies", link("ally"));
        break;
      case "enemy":
        add("rivals", link("rival"));
        break;
      case "ancestor":
        add(incoming ? "family" : "next", link(incoming ? "family" : "lineage"));
        break;
    }
  }

  for (const c of childrenOf(focus)) {
    add("next", { ...c, category: "lineage" });
    for (const g of childrenOf(c.person.id)) {
      add("next", {
        person: g.person,
        role: g.person.gender === "f" ? "Granddaughter" : "Grandson",
        category: "lineage",
        note: `Through ${c.person.shortName ?? c.person.name}`,
      });
    }
  }
  // Children come before later descendants and students.
  const rank = (l: Link) => (l.category === "lineage" ? (l.role === "Descendant" ? 1 : 0) : 2);
  groups.next.sort((a, b) => rank(a) - rank(b));

  return groups;
}

export function connectionCount(id: string) {
  const g = groupsFor(id);
  return new Set(Object.values(g).flat().map((l) => l.person.id)).size;
}
