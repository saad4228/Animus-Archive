import type { EraId, GameId } from "./types";

export interface Game {
  id: GameId;
  title: string;
  short: string;
  year: number;
}

export const games: Game[] = [
  { id: "ac1", title: "Assassin's Creed", short: "Assassin's Creed", year: 2007 },
  { id: "ac2", title: "Assassin's Creed II", short: "AC II", year: 2009 },
  { id: "brotherhood", title: "Assassin's Creed Brotherhood", short: "Brotherhood", year: 2010 },
  { id: "revelations", title: "Assassin's Creed Revelations", short: "Revelations", year: 2011 },
  { id: "ac3", title: "Assassin's Creed III", short: "AC III", year: 2012 },
  { id: "liberation", title: "Assassin's Creed III: Liberation", short: "Liberation", year: 2012 },
  { id: "black-flag", title: "Assassin's Creed IV: Black Flag", short: "Black Flag", year: 2013 },
  { id: "freedom-cry", title: "Assassin's Creed Freedom Cry", short: "Freedom Cry", year: 2013 },
  { id: "rogue", title: "Assassin's Creed Rogue", short: "Rogue", year: 2014 },
  { id: "unity", title: "Assassin's Creed Unity", short: "Unity", year: 2014 },
  { id: "syndicate", title: "Assassin's Creed Syndicate", short: "Syndicate", year: 2015 },
  { id: "origins", title: "Assassin's Creed Origins", short: "Origins", year: 2017 },
  { id: "odyssey", title: "Assassin's Creed Odyssey", short: "Odyssey", year: 2018 },
  { id: "valhalla", title: "Assassin's Creed Valhalla", short: "Valhalla", year: 2020 },
  { id: "mirage", title: "Assassin's Creed Mirage", short: "Mirage", year: 2023 },
  { id: "shadows", title: "Assassin's Creed Shadows", short: "Shadows", year: 2025 },
];

export const gameById = Object.fromEntries(games.map((g) => [g.id, g])) as Record<GameId, Game>;

export interface Era {
  id: EraId;
  name: string;
  /** Approximate span shown under the era name. */
  span: string;
  /** Sort key: a representative year, negative for BCE. */
  sortYear: number;
}

export const eras: Era[] = [
  { id: "classical-greece", name: "Classical Greece", span: "5th c. BCE", sortYear: -431 },
  { id: "ptolemaic-egypt", name: "Ptolemaic Egypt", span: "1st c. BCE", sortYear: -49 },
  { id: "viking-age", name: "Viking Age & Abbasid", span: "9th c.", sortYear: 861 },
  { id: "crusades", name: "The Crusades", span: "12th–13th c.", sortYear: 1191 },
  { id: "renaissance", name: "Renaissance", span: "15th–16th c.", sortYear: 1476 },
  { id: "sengoku", name: "Sengoku Japan", span: "16th c.", sortYear: 1579 },
  { id: "golden-age-piracy", name: "Golden Age of Piracy", span: "1710s–1720s", sortYear: 1715 },
  { id: "age-of-revolution", name: "Age of Revolution", span: "1750s–1790s", sortYear: 1765 },
  { id: "victorian", name: "Victorian London", span: "19th c.", sortYear: 1868 },
  { id: "modern", name: "Modern Day", span: "21st c.", sortYear: 2012 },
];

export const eraById = Object.fromEntries(eras.map((e) => [e.id, e])) as Record<EraId, Era>;

export const factionLabel = {
  brotherhood: "Assassins & Hidden Ones",
  templar: "Templars & the Order",
  independent: "Independent",
} as const;
