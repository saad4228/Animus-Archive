import type { Relationship, RelationType } from "./types";

/**
 * Every relationship in the archive, stored once. Profiles, family trees and the
 * Relationships page all read from this list.
 *
 * Siblings who share a recorded parent are derived (see lib/relations.ts), so
 * explicit `sibling` edges are only needed when the parents are not in the data.
 */
function rel(type: RelationType, from: string, to: string, fromRole: string, toRole: string, note?: string): Relationship {
  return { id: `${type}:${from}:${to}`, type, from, to, fromRole, toRole, note };
}

const child = (parent: string, kid: string, parentRole: "Father" | "Mother", kidRole: "Son" | "Daughter", note?: string) =>
  rel("parent", parent, kid, parentRole, kidRole, note);

export const relationships: Relationship[] = [
  // ── Auditore ─────────────────────────────────────────────
  rel("spouse", "giovanni-auditore", "maria-auditore", "Husband", "Wife"),
  // In birth order: the family tree keeps the order children are listed in.
  ...([
    ["federico-auditore", "Son"],
    ["ezio", "Son"],
    ["claudia-auditore", "Daughter"],
    ["petruccio-auditore", "Son"],
  ] as const).flatMap(([kid, role]) => [
    child("giovanni-auditore", kid, "Father", role),
    child("maria-auditore", kid, "Mother", role),
  ]),
  rel("sibling", "mario-auditore", "giovanni-auditore", "Brother", "Brother"),
  rel("relative", "mario-auditore", "ezio", "Uncle", "Nephew"),
  rel("mentor", "mario-auditore", "ezio", "Mentor", "Student", "Trained Ezio at Monteriggioni"),
  rel("mentor", "paola", "ezio", "Mentor", "Student", "Taught him to move unseen"),
  rel("spouse", "ezio", "sofia-sartor", "Husband", "Wife", "Married after 1512"),
  child("ezio", "flavia-auditore", "Father", "Daughter"),
  child("sofia-sartor", "flavia-auditore", "Mother", "Daughter"),
  child("ezio", "marcello-auditore", "Father", "Son"),
  child("sofia-sartor", "marcello-auditore", "Mother", "Son"),
  rel("romance", "cristina-vespucci", "ezio", "First love", "Lover"),
  rel("romance", "caterina-sforza", "ezio", "Lover", "Lover"),
  rel("ally", "leonardo", "ezio", "Lifelong friend", "Friend"),
  rel("ally", "machiavelli", "ezio", "Ally", "Ally"),
  rel("ally", "la-volpe", "ezio", "Ally", "Ally"),
  rel("ally", "claudia-auditore", "ezio", "Fellow Assassin", "Fellow Assassin"),
  rel("mentor", "ezio", "shao-jun", "Mentor", "Student"),
  rel("enemy", "rodrigo-borgia", "ezio", "Templar Grand Master", "Enemy", "Behind the Auditore executions"),
  rel("enemy", "cesare-borgia", "ezio", "Enemy", "Enemy"),
  rel("enemy", "ahmet", "ezio", "Templar Grand Master", "Enemy"),
  rel("legacy", "altair", "ezio", "Predecessor", "Successor", "Ezio relived Altaïr's memories through the Masyaf keys"),
  rel("ancestor", "ezio", "desmond", "Ancestor", "Descendant"),

  // ── Kenway ───────────────────────────────────────────────
  rel("spouse", "bernard-kenway", "linette-kenway", "Husband", "Wife"),
  child("bernard-kenway", "edward", "Father", "Son"),
  child("linette-kenway", "edward", "Mother", "Son"),
  rel("spouse", "edward", "caroline-scott", "Husband", "First wife", "Married 1712; she died c. 1720"),
  rel("spouse", "edward", "tessa-kenway", "Husband", "Second wife", "Married in London by 1725"),
  child("edward", "jennifer-scott", "Father", "Daughter"),
  child("caroline-scott", "jennifer-scott", "Mother", "Daughter"),
  child("edward", "haytham", "Father", "Son"),
  child("tessa-kenway", "haytham", "Mother", "Son"),
  rel("mentor", "ah-tabai", "edward", "Mentor", "Student", "Welcomed him into the Brotherhood in 1721"),
  rel("ally", "adewale", "edward", "Quartermaster & friend", "Captain"),
  rel("ally", "edward-thatch", "edward", "Friend", "Friend"),
  rel("ally", "mary-read", "edward", "Friend", "Friend"),
  rel("ally", "anne-bonny", "edward", "Friend", "Friend"),
  rel("ally", "stede-bonnet", "edward", "Friend", "Friend"),
  rel("enemy", "benjamin-hornigold", "edward", "Friend turned Templar", "Enemy", "Killed by Edward around 1719"),
  rel("enemy", "bartholomew-roberts", "edward", "Betrayer", "Enemy", "Killed by Edward in 1722"),
  rel("enemy", "laureano-torres", "edward", "Templar Grand Master", "Enemy", "Killed by Edward in 1722"),
  rel("enemy", "woodes-rogers", "edward", "Templar", "Enemy"),
  rel("enemy", "duncan-walpole", "edward", "Enemy", "Killer", "Killed by Edward in 1715"),
  rel("enemy", "reginald-birch", "edward", "Templar Grand Master", "Enemy", "His mercenaries killed Edward in 1735"),
  rel("ancestor", "edward", "desmond", "Ancestor", "Descendant"),

  // ── Haytham, Connor & the colonies ──────────────────────
  rel("mentor", "reginald-birch", "haytham", "Mentor", "Student", "Raised him as a Templar"),
  rel("romance", "kaniehtiio", "haytham", "Partner", "Partner"),
  child("haytham", "connor", "Father", "Son"),
  child("kaniehtiio", "connor", "Mother", "Son"),
  rel("enemy", "haytham", "connor", "Father & enemy", "Son & enemy"),
  rel("ally", "charles-lee", "haytham", "Protégé", "Grand Master"),
  rel("ally", "shay", "haytham", "Templar ally", "Grand Master"),
  rel("mentor", "achilles-davenport", "connor", "Mentor", "Student"),
  rel("enemy", "charles-lee", "connor", "Enemy", "Enemy"),
  rel("mentor", "achilles-davenport", "shay", "Former Mentor", "Former student"),
  rel("enemy", "achilles-davenport", "shay", "Enemy", "Enemy", "Shay broke with the Brotherhood"),
  rel("ancestor", "haytham", "desmond", "Ancestor", "Descendant"),
  rel("ancestor", "connor", "desmond", "Ancestor", "Descendant"),

  // ── Altaïr ───────────────────────────────────────────────
  rel("spouse", "altair", "maria-thorpe", "Husband", "Wife"),
  child("altair", "darim", "Father", "Son"),
  child("maria-thorpe", "darim", "Mother", "Son"),
  child("altair", "sef", "Father", "Son"),
  child("maria-thorpe", "sef", "Mother", "Son"),
  rel("mentor", "al-mualim", "altair", "Mentor", "Student"),
  rel("enemy", "al-mualim", "altair", "Traitor", "Enemy", "Revealed as a Templar"),
  rel("ancestor", "altair", "desmond", "Ancestor", "Descendant", "Through Altaïr's son Sef"),

  // ── Ancient world ───────────────────────────────────────
  rel("spouse", "bayek", "aya", "Husband", "Wife"),
  child("bayek", "khemu", "Father", "Son"),
  child("aya", "khemu", "Mother", "Son"),
  child("myrrine", "kassandra", "Mother", "Daughter"),
  child("myrrine", "alexios", "Mother", "Son"),
  rel("sibling", "kassandra", "alexios", "Half-sister", "Half-brother"),
  rel("relative", "leonidas", "kassandra", "Grandfather", "Granddaughter"),
  rel("relative", "leonidas", "alexios", "Grandfather", "Grandson"),
  rel("ancestor", "kassandra", "aya", "Ancestor", "Descendant", "Through Kassandra's son Elpidios"),
  rel("ally", "kassandra", "layla", "Keeper of the Staff", "Heir", "Passed the Staff of Hermes to Layla in 2018"),

  // ── Viking Age ───────────────────────────────────────────
  rel("sibling", "sigurd", "eivor", "Adoptive brother", "Adoptive sister"),
  rel("enemy", "basim", "eivor", "Ally turned enemy", "Ally turned enemy"),

  // ── Later eras ───────────────────────────────────────────
  rel("sibling", "evie", "jacob", "Twin sister", "Twin brother"),
  rel("spouse", "henry-green", "evie", "Husband", "Wife"),
  child("charles-dorian", "arno", "Father", "Son"),
  rel("romance", "elise", "arno", "Love", "Love"),
  child("fujibayashi-nagato", "naoe", "Father", "Daughter"),
  rel("ally", "yasuke", "naoe", "Ally", "Ally"),
  child("william-miles", "desmond", "Father", "Son"),
];
