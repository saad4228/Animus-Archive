export type GameId =
  | "ac1"
  | "ac2"
  | "brotherhood"
  | "revelations"
  | "ac3"
  | "liberation"
  | "black-flag"
  | "freedom-cry"
  | "rogue"
  | "unity"
  | "syndicate"
  | "origins"
  | "odyssey"
  | "valhalla"
  | "mirage"
  | "shadows";

export type EraId =
  | "classical-greece"
  | "ptolemaic-egypt"
  | "viking-age"
  | "crusades"
  | "renaissance"
  | "sengoku"
  | "golden-age-piracy"
  | "age-of-revolution"
  | "victorian"
  | "modern";

/** Broad faction used for the card insignia and the affiliation filter. */
export type Faction = "brotherhood" | "templar" | "independent";

export type Gender = "m" | "f";

/** A partial date. Only fields that are verified are filled in. */
export interface HistDate {
  year: number;
  bce?: boolean;
  approx?: boolean;
  /** Human-readable precise date, e.g. "24 June 1459". */
  exact?: string;
  /** For deaths known only as "after X". */
  after?: boolean;
}

export interface Source {
  label: string;
  url: string;
}

export interface Quote {
  /** The line itself. Newlines are kept, so an exchange can run over several lines. */
  text: string;
  /** Where it is said; shown under the quote. */
  context: string;
  source?: Source;
}

export interface TimelineEvent {
  /** Display date, e.g. "1476" or "Dec 1735". */
  date: string;
  title: string;
  body: string;
}

export interface Palette {
  /** Secondary accent taken from the character's setting. */
  accent: string;
  /** Two atmosphere colours used for gradients when no art is present. */
  sky: string;
  ground: string;
}

/** Fields present only for characters that have a full dossier page. */
export interface Dossier {
  /** Epithet under the name, e.g. "da Firenze" or "The Pirate Assassin". */
  epithet: string;
  /** Unattributed editorial line. Never presented as dialogue. */
  tagline: string;
  /** A parting line for the Legacy section, where the character's own quote sits elsewhere. */
  closingQuote?: Quote;
  /** Short motto in the hero margin, e.g. the creed in Italian. */
  epigraph?: { text: string; translation?: string };
  themes: string[];
  info: { label: string; value: string }[];
  /** The place marked on the parchment's map fragment. Coordinates only where they are known. */
  locus?: { name: string; coords?: string };
  /** A line the character is known for saying, signed off on the hero's map fragment. */
  signature?: string;
  emblem: "lily" | "jolly-roger" | "brotherhood";
  biography: string[];
  legacy: string;
  sources: Source[];
}

/**
 * Homepage composition on desktop (CSS lengths/percentages of the screen):
 * where the setting starts (it fades in from the left), its focal point, and
 * where the figure's head sits and how tall the figure is.
 */
export interface HomeFraming {
  sceneLeft?: string;
  /** "width": show the whole setting edge to edge (over a blurred copy) instead of cropping it. */
  sceneFit?: "cover" | "width";
  /** With sceneFit "width": distance from the top of the screen to the image. */
  sceneTop?: string;
  scenePosition?: string;
  figureLeft?: string;
  figureTop?: string;
  figureHeight?: string;
}

export interface Character {
  id: string;
  name: string;
  /** Short form used in tight spaces (cards, map nodes). */
  shortName?: string;
  aliases?: string[];
  gender: Gender;
  born?: HistDate;
  died?: HistDate;
  birthplace?: string;
  era?: EraId;
  faction: Faction;
  /** Displayed affiliations, most significant first. */
  affiliations: string[];
  /** One line: who they are. */
  role: string;
  /** A line of theirs from the games, shown on the homepage and their profile. */
  quote?: Quote;
  games: GameId[];
  /** In the Characters directory (playable characters and the modern day). */
  directory: boolean;
  protagonist?: boolean;
  playable?: boolean;
  modernDay?: boolean;
  /** Shown in the homepage featured strip (sorted by era; this breaks ties). */
  featuredOrder?: number;
  /** Setting line on cards: "Florence", "The Caribbean". */
  setting?: string;
  palette?: Palette;
  /** Editorial theme words for the homepage markers (dossiers carry their own). */
  themes?: string[];
  /** CSS object-position focal points, tuned per image once art exists. */
  framing?: {
    hero?: string;
    portrait?: string;
    /** Zoom the setting from an anchor so its landmark clears the figure. */
    scene?: { zoom: number; origin: string };
    home?: HomeFraming;
  };
  dossier?: Dossier;
  /**
   * Key moments, oldest first. Not part of the dossier: a character can have a
   * checked timeline long before anyone writes their full biography.
   */
  timeline?: TimelineEvent[];
  /** Free-form note shown with the profile, e.g. canon caveats. */
  note?: string;
  sources?: Source[];
}

export type RelationType =
  | "parent"
  | "sibling"
  | "relative"
  | "spouse"
  | "romance"
  | "mentor"
  | "ally"
  | "enemy"
  | "ancestor"
  | "legacy";

/**
 * A directed relationship. `fromRole` is what `from` is to `to`
 * ("Father"), `toRole` is what `to` is to `from` ("Son").
 * Direction matters for parent, mentor, ancestor and legacy.
 */
export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: RelationType;
  fromRole: string;
  toRole: string;
  note?: string;
  source?: Source;
}
