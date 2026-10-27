import { eraById, gameById } from "@/data/catalog";
import type { Character } from "@/data/types";

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`:]/g, "")
    .toLowerCase()
    .trim();

interface Field {
  text: string;
  weight: number;
}

function fields(c: Character): Field[] {
  return [
    { text: c.name, weight: 10 },
    ...(c.shortName ? [{ text: c.shortName, weight: 10 }] : []),
    ...(c.aliases ?? []).map((a) => ({ text: a, weight: 8 })),
    ...c.games.flatMap((g) => [
      { text: gameById[g].title, weight: 5 },
      { text: gameById[g].short, weight: 5 },
    ]),
    ...(c.era ? [{ text: eraById[c.era].name, weight: 4 }] : []),
    ...(c.setting ? [{ text: c.setting, weight: 4 }] : []),
    ...(c.birthplace ? [{ text: c.birthplace, weight: 3 }] : []),
    ...c.affiliations.map((a) => ({ text: a, weight: 2 })),
  ];
}

export interface SearchHit {
  character: Character;
  score: number;
  /** The field that matched best, shown when it isn't the name. */
  matched: string;
}

/**
 * Every query word must match somewhere. A word scores highest when it starts
 * the field, then when it starts a word in the field, then anywhere inside.
 */
export function search(list: Character[], query: string): SearchHit[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const hits: SearchHit[] = [];
  for (const c of list) {
    const fs = fields(c).map((f) => ({ ...f, norm: normalize(f.text) }));
    let total = 0;
    let best: { score: number; text: string } = { score: 0, text: c.name };
    let allMatched = true;

    for (const w of words) {
      let wordBest = 0;
      for (const f of fs) {
        let s = 0;
        if (f.norm.startsWith(w)) s = 3;
        else if (f.norm.split(/[\s\-–,()]+/).some((part) => part.startsWith(w))) s = 2;
        else if (w.length > 2 && f.norm.includes(w)) s = 1;
        s *= f.weight;
        if (s > wordBest) wordBest = s;
        if (s > best.score) best = { score: s, text: f.text };
      }
      if (!wordBest) {
        allMatched = false;
        break;
      }
      total += wordBest;
    }
    if (allMatched) hits.push({ character: c, score: total, matched: best.text });
  }
  return hits.sort((a, b) => b.score - a.score || a.character.name.localeCompare(b.character.name));
}
