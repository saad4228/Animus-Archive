// npm run art:emblems
// Traces the faction marks in scripts/art/local/emblem-<kind>.png into SVG paths and writes
// components/ui/emblem-paths.ts. Run this after replacing one of those images.
//
// The paths are baked into the component rather than loaded as images so they stay crisp at
// every size (16px on a card, 480px as a watermark) and take their colour from the surrounding
// text. Coordinates are mapped into Emblem's 48x48 box with a 2-unit inset and rounded to two
// decimals, which keeps the file a fraction of potrace's raw output.
import { writeFileSync } from "node:fs";
import path from "node:path";
import potrace from "potrace";
import sharp from "sharp";

const BOX = 48;
const INSET = 2;
const local = path.join(process.cwd(), "scripts", "art", "local");

const kinds = [
  // The Assassin artwork is a flattened screenshot: a white shape on a grey checkerboard.
  { kind: "brotherhood", file: "emblem-brotherhood.png", shape: "white" },
  // The Templar cross is a real cut-out, so its alpha is the shape.
  { kind: "templar", file: "emblem-templar.png", shape: "alpha" },
  // The site mark: the detailed insignia, cropped from the logo above its wordmark.
  { kind: "seal", file: "emblem-seal.png", shape: "alpha" },
];

const trace = (buf, opts) => new Promise((res, rej) => potrace.trace(buf, opts, (e, svg) => (e ? rej(e) : res(svg))));

/** 12.340 -> "12.34", 0.5 -> ".5" */
function num(v) {
  let s = v.toFixed(2).replace(/\.?0+$/, "");
  if (s === "" || s === "-") s = "0";
  return s.replace(/^(-?)0\./, "$1.");
}

const paths = {};
for (const { kind, file, shape } of kinds) {
  const { data, info } = await sharp(path.join(local, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // potrace traces dark pixels, so the emblem is black and everything else white.
  const mask = Buffer.alloc(info.width * info.height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const opaque = data[i + 3] > 128;
    const on = shape === "alpha" ? opaque : opaque && (data[i] + data[i + 1] + data[i + 2]) / 3 > 230;
    mask[p] = on ? 0 : 255;
  }
  const trimmed = await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .trim({ threshold: 10, background: "#fff" })
    .toBuffer({ resolveWithObject: true });

  const svg = await trace(trimmed.data, { threshold: 128, turdSize: 60, optCurve: true, optTolerance: 0.6 });
  const raw = svg.match(/ d="([^"]+)"/)[1];
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);

  const scale = (BOX - INSET * 2) / Math.max(w, h);
  const dx = (BOX - w * scale) / 2;
  const dy = (BOX - h * scale) / 2;

  // potrace emits absolute M and C only, so every number is one coordinate of an x,y pair.
  let axis = 0;
  paths[kind] = raw
    .replace(/,/g, " ")
    .trim()
    .split(/\s+/)
    .map((token) => {
      if (/^[A-Za-z]$/.test(token)) {
        axis = 0;
        return token;
      }
      const v = Number(token);
      return num(axis++ % 2 === 0 ? v * scale + dx : v * scale + dy);
    })
    .join(" ")
    .replace(/([A-Za-z]) /g, "$1")
    .replace(/ -/g, "-");

  console.log(`${kind.padEnd(12)} ${raw.length} -> ${paths[kind].length} chars`);
}

const out = `/**
 * The Assassin insignia and the Templar cross, traced from the artwork supplied for this
 * project (scripts/art/local/emblem-*.png) into a 48x48 box with a 2-unit inset.
 * Regenerate with \`npm run art:emblems\`.
 *
 * They are drawn once as sprite symbols (see EmblemDefs in ./Emblem) because the emblem
 * appears many times per page: once per character card, map node and dossier.
 */
export const emblemPaths = {
  brotherhood:
    "${paths.brotherhood}",
  templar:
    "${paths.templar}",
  seal:
    "${paths.seal}",
} as const;
`;
writeFileSync(path.join(process.cwd(), "components", "ui", "emblem-paths.ts"), out);
console.log("wrote components/ui/emblem-paths.ts");
