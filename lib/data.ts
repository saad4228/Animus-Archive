import { characters } from "@/data/characters";
import { eraById, gameById } from "@/data/catalog";
import type { Character, HistDate } from "@/data/types";

const byId = new Map(characters.map((c) => [c.id, c]));

export function getCharacter(id: string): Character | undefined {
  return byId.get(id);
}

export function requireCharacter(id: string): Character {
  const c = byId.get(id);
  if (!c) throw new Error(`Unknown character "${id}" referenced in data`);
  return c;
}

/** Characters with a page of their own. */
export const directoryCharacters = characters.filter((c) => c.directory);

/** Homepage strip, in historical order. */
export const featuredCharacters = characters
  .filter((c) => c.featuredOrder !== undefined)
  .sort((a, b) => chronoKey(a) - chronoKey(b) || a.featuredOrder! - b.featuredOrder!);

export function hasProfile(c: Character) {
  return c.directory;
}

export function displayName(c: Character) {
  return c.shortName ?? c.name;
}

export function formatDate(d: HistDate) {
  const year = d.bce ? `${d.year} BCE` : `${d.year}`;
  return `${d.approx ? "c. " : ""}${d.after ? "after " : ""}${year}`;
}

/**
 * "1459 – 1524", "b. 1756", "c. 85 BCE", "458 BCE – 2018 CE".
 * When only the birth is known we say so rather than leaving an open dash — but
 * not as "b. c. 85 BCE", which in the cards' small caps reads as "BC ... BCE".
 */
export function lifespan(c: Character): string | undefined {
  if (!c.born) return undefined;
  if (!c.died) return c.born.approx ? formatDate(c.born) : `b. ${formatDate(c.born)}`;
  const crossesEra = c.born.bce && !c.died.bce;
  const end = crossesEra ? `${formatDate(c.died)} CE` : formatDate(c.died);
  return `${formatDate(c.born)} – ${end}`;
}

export function eraName(c: Character) {
  return c.era ? eraById[c.era].name : undefined;
}

export function gameTitles(c: Character) {
  return c.games.map((g) => gameById[g].title);
}

export function firstRelease(c: Character) {
  return Math.min(...c.games.map((g) => gameById[g].year), 9999);
}

/** Sort key for chronological ordering. */
export function chronoKey(c: Character) {
  if (c.born) return c.born.bce ? -c.born.year : c.born.year;
  return c.era ? eraById[c.era].sortYear : 9999;
}

export function initials(c: Character) {
  return displayName(c)
    .split(/[\s-]+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}
