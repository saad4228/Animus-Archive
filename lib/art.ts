import manifest from "@/public/images/manifest.json";

export interface ImageInfo {
  src: string;
  w: number;
  h: number;
}

/**
 * The same picture at several widths. They are plain files under public/, so the
 * browser picks one through `srcset` and the server just hands it over — nothing
 * is resized per request, which is what the big hero figures used to wait on.
 */
export interface ResponsiveImage extends ImageInfo {
  sources: ImageInfo[];
}

export interface RenderInfo extends ResponsiveImage {
  /** Horizontal centre of the head, 0–1 across the render. */
  headX: number;
}

export function srcSet(image: ResponsiveImage) {
  return image.sources.map((s) => `${s.src} ${s.w}w`).join(", ");
}

/**
 * Everything the archive holds for one character, written by scripts/art/build.mjs
 * from official art (see docs/assets.md). Anything missing renders as a designed
 * empty state, never a stand-in picture.
 */
export interface Art {
  /** Transparent full-figure cut-out, placed over `scene` at runtime. */
  render?: RenderInfo;
  scene?: ResponsiveImage;
  /** 2:3 bust for cards, search and map nodes. */
  portrait?: string;
  /** 3:2 bust for the home strip. */
  card?: string;
  /** Biography band: early life or family, where such art exists. */
  bio?: ResponsiveImage;
  gallery: ResponsiveImage[];
  /** Cycled over the Key moments rail. */
  moments: ResponsiveImage[];
}

export type ArtMap = Record<string, Art>;

/** Stand-in for a character the manifest has nothing for. */
export const NO_ART: Art = { gallery: [], moments: [] };

/** As stored: the scene is a key into `scenes`, and the lists may be absent. */
type Entry = Omit<Art, "scene" | "gallery" | "moments"> & {
  scene?: string;
  gallery?: ResponsiveImage[];
  moments?: ResponsiveImage[];
};

const characters = manifest.characters as Record<string, Entry>;
const scenes = manifest.scenes as Record<string, ResponsiveImage>;
const banners = manifest.banners as Record<string, ImageInfo>;

/** A wide page banner, e.g. the cast across the top of the Characters page. */
export const getBanner = (name: string): ImageInfo | undefined => banners[name];

export function getArt(id: string): Art {
  const e = characters[id];
  if (!e) return NO_ART;
  return { ...e, scene: e.scene ? scenes[e.scene] : undefined, gallery: e.gallery ?? [], moments: e.moments ?? [] };
}

export const getArtMap = (): ArtMap => Object.fromEntries(Object.keys(characters).map((id) => [id, getArt(id)]));

/** One representative setting per era, for the Characters page timeline. */
const eraScene: Record<string, string> = {
  "classical-greece": "aegean",
  "ptolemaic-egypt": "siwa",
  "viking-age": "norway",
  crusades: "masyaf",
  renaissance: "florence",
  sengoku: "iga",
  "golden-age-piracy": "caribbean",
  "age-of-revolution": "new-york",
  victorian: "london",
  modern: "nexus",
};

export const getEraScenes = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(eraScene)
      .filter(([, s]) => scenes[s])
      .map(([era, s]) => [era, scenes[s].src]),
  );
