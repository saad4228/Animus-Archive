/**
 * Advance widths of Cinzel's uppercase glyphs, in em, measured from the font as
 * the site loads it. Used to size a heading so it fills its column on one line
 * instead of guessing with viewport units and wrapping on the wide letters.
 */
const CINZEL: Record<string, number> = {
  "'": 0.17,
  ":": 0.179,
  ".": 0.179,
  " ": 0.25,
  J: 0.324,
  I: 0.338,
  Í: 0.338,
  Ì: 0.338,
  Î: 0.338,
  Ï: 0.338,
  "1": 0.3755,
  "-": 0.38,
  S: 0.475,
  "5": 0.498,
  "7": 0.502,
  "3": 0.503,
  F: 0.541,
  L: 0.5485,
  "8": 0.552,
  "2": 0.553,
  "6": 0.56,
  "9": 0.56,
  E: 0.568,
  É: 0.568,
  È: 0.568,
  Ê: 0.568,
  Ë: 0.568,
  P: 0.5725,
  B: 0.577,
  "4": 0.583,
  "0": 0.587,
  T: 0.6315,
  R: 0.65,
  Z: 0.651,
  K: 0.657,
  Y: 0.661,
  X: 0.662,
  A: 0.712,
  Á: 0.712,
  À: 0.712,
  Â: 0.712,
  Ä: 0.712,
  Å: 0.712,
  V: 0.74,
  C: 0.76,
  Ç: 0.76,
  U: 0.785,
  Ú: 0.785,
  Ù: 0.785,
  Û: 0.785,
  Ü: 0.785,
  D: 0.789,
  G: 0.798,
  H: 0.813,
  Ø: 0.828,
  N: 0.832,
  Q: 0.837,
  O: 0.838,
  Ó: 0.838,
  Ò: 0.838,
  Ô: 0.838,
  Ö: 0.838,
  Ñ: 0.841,
  M: 0.931,
  W: 0.982,
};

/** A wide-ish default, so an unmeasured glyph errs towards a smaller heading. */
const UNKNOWN = 0.8;

/** Width of `text` set in Cinzel caps, in em, including the tracking `.display` adds. */
export function cinzelEm(text: string, tracking = 0.06) {
  return [...text.toUpperCase()].reduce((w, ch) => w + (CINZEL[ch] ?? UNKNOWN) + tracking, 0);
}

/**
 * `font-size` for a Cinzel caps heading that fills its column on a single line.
 *
 * The column is read with `cqw`, so this is exact at every width instead of
 * calibrated to one viewport — the heading's nearest `@container` ancestor has
 * to be the text column. `fill` leaves a little room at the line's end, and
 * `maxPx` stops a short name like "Alexios" from dwarfing everything else.
 */
export function fitCaps(text: string, { maxPx = 54, minPx = 20, fill = 0.92 } = {}) {
  const em = cinzelEm(text);
  return `clamp(${minPx}px, calc(100cqw * ${fill} / ${em.toFixed(2)}), ${maxPx}px)`;
}
