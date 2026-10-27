// npm run art:build
// Turns the official art in .art-cache/ (see sources.json, `npm run art:fetch`) into the
// site's images plus public/images/manifest.json. Generated files carry a content hash in
// their names, so changed art always gets a new URL.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const project = process.cwd();
const dl = path.join(project, ".art-cache");
const pub = path.join(project, "public", "images");
// Art supplied directly for this project lives in scripts/art/local/ and is checked in;
// it is referenced as "local:<name>". Everything else comes from .art-cache/.
const local = path.join(project, "scripts", "art", "local");
const src = (name) => {
  const [dir, base] = name.startsWith("local:") ? [local, name.slice(6)] : [dl, name];
  const f = readdirSync(dir).find((x) => x.replace(/\.[^.]+$/, "") === base);
  if (!f) throw new Error(`missing art ${name}`);
  return path.join(dir, f);
};

// ── What goes where ────────────────────────────────────────────
// env: scene file; crop: [left%, top%, right%, bottom%] trimmed off (watermarks); focus: x% for portrait/card backgrounds.
const scenes = {
  masyaf: { file: "local:altair-masyaf" },
  florence: { file: "local:ezio-florence" },
  frontier: { file: "local:connor-frontier" },
  caribbean: { file: "local:edward-harbour" },
  havana: { file: "env-blackflag-rez1" },
  siwa: { file: "env-siwa" },
  aegean: { file: "local:kassandra-aegean" },
  greece: { file: "local:alexios-greece" },
  norway: { file: "local:eivor-norway" },
  baghdad: { file: "local:basim-baghdad" },
  iga: { file: "local:naoe-iga" },
  kyoto: { file: "env-japan-kyoto" },
  paris: { file: "local:arno-paris" },
  london: { file: "local:frye-london" },
  "north-atlantic": { file: "env-north-atlantic" },
  "new-york": { file: "env-new-york" },
  "new-orleans": { file: "env-new-orleans", crop: [0, 0, 0, 13] },
  nexus: { file: "env-nexus" },
  yggdrasil: { file: "env-yggdrasil" },
};

// Directory characters: render + scene. headX overrides the detected head centre (0–1) when needed.
const leads = {
  altair: { render: "render-altair-v", scene: "masyaf" },
  ezio: { render: "render-ezio", scene: "florence" },
  connor: { render: "local:connor-figure", scene: "frontier" },
  // An earlier back view of Edward is kept as local:edward-back.
  edward: { render: "local:edward-figure", scene: "caribbean" },
  bayek: { render: "render-bayek", scene: "siwa" },
  kassandra: { render: "render-kassandra", scene: "aegean" },
  alexios: { render: "render-alexios", scene: "greece" },
  eivor: { render: "render-eivor", scene: "norway" },
  basim: { render: "render-basim", scene: "baghdad" },
  naoe: { render: "render-naoe", scene: "iga" },
  yasuke: { render: "render-yasuke", scene: "kyoto" },
  haytham: { render: "local:haytham-figure", scene: "new-york" },
  shay: { render: "render-shay", scene: "north-atlantic" },
  aveline: { render: "render-aveline", scene: "new-orleans" },
  adewale: { render: "render-adewale", scene: "havana" },
  arno: { render: "local:arno-figure", scene: "paris" },
  jacob: { render: "render-jacob", scene: "london" },
  evie: { render: "render-evie", scene: "london" },
  desmond: { render: "local:desmond-figure", scene: "nexus" },
  layla: { render: "local:layla-figure", scene: "yggdrasil" },
};

// Supporting characters: image + the scene of their era (used behind transparent renders).
const eraScene = {
  renaissance: "florence", "golden-age-piracy": "caribbean", "age-of-revolution": "new-york", crusades: "masyaf",
  "ptolemaic-egypt": "siwa", "classical-greece": "aegean", "viking-age": "norway", sengoku: "iga", victorian: "london",
  modern: "nexus",
};
const supportingEra = {
  "giovanni-auditore": "renaissance", "maria-auditore": "renaissance", "federico-auditore": "renaissance",
  "claudia-auditore": "renaissance", "petruccio-auditore": "renaissance", "mario-auditore": "renaissance",
  "sofia-sartor": "renaissance", "flavia-auditore": "renaissance", "marcello-auditore": "renaissance", paola: "renaissance",
  leonardo: "renaissance", machiavelli: "renaissance", "la-volpe": "renaissance", "caterina-sforza": "renaissance",
  "cristina-vespucci": "renaissance", "shao-jun": "renaissance", "rodrigo-borgia": "renaissance",
  "cesare-borgia": "renaissance", ahmet: "renaissance",
  "caroline-scott": "golden-age-piracy", "jennifer-scott": "golden-age-piracy", "tessa-kenway": "golden-age-piracy",
  "ah-tabai": "golden-age-piracy", "edward-thatch": "golden-age-piracy", "mary-read": "golden-age-piracy",
  "anne-bonny": "golden-age-piracy", "stede-bonnet": "golden-age-piracy", "benjamin-hornigold": "golden-age-piracy",
  "bartholomew-roberts": "golden-age-piracy", "laureano-torres": "golden-age-piracy", "woodes-rogers": "golden-age-piracy",
  "duncan-walpole": "golden-age-piracy", "reginald-birch": "golden-age-piracy",
  kaniehtiio: "age-of-revolution", "achilles-davenport": "age-of-revolution", "charles-lee": "age-of-revolution",
  elise: "age-of-revolution", "charles-dorian": "age-of-revolution",
  "maria-thorpe": "crusades", darim: "crusades", "al-mualim": "crusades",
  aya: "ptolemaic-egypt", khemu: "ptolemaic-egypt", myrrine: "classical-greece", leonidas: "classical-greece",
  sigurd: "viking-age", "henry-green": "victorian", "fujibayashi-nagato": "sengoku", "william-miles": "modern",
};

// ── Helpers ────────────────────────────────────────────────────
// Wide page banners, used as-is apart from resizing.
const banners = { characters: "local:characters-banner" };

const manifest = { characters: {}, scenes: {}, banners: {} };
const outPath = (...p) => {
  const f = path.join(pub, ...p);
  mkdirSync(path.dirname(f), { recursive: true });
  return f;
};

/** Writes a sharp pipeline to images/<dir>/<name>.<hash>.webp so changed art always gets a new URL. */
async function save(pipeline, dir, name) {
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const hash = createHash("sha1").update(data).digest("hex").slice(0, 8);
  const rel = `${dir}/${name}.${hash}.webp`;
  writeFileSync(outPath(...rel.split("/")), data);
  return { src: `/images/${rel}`, w: info.width, h: info.height };
}

/**
 * Saves the same image at several widths so the browser can pick one with srcset.
 * These are plain files under public/, so they are served straight from disk — no
 * resizing at request time, which is what made the big figures slow to appear.
 * Returns the largest as `src` plus every size in `sources`, widest last.
 */
async function saveResponsive(input, dir, name, widths, { quality = 82, alphaQuality = 88 } = {}) {
  const buf = Buffer.isBuffer(input) ? input : await sharp(input).toBuffer();
  const full = await sharp(buf).metadata();
  const sources = [];
  for (const w of widths) {
    if (w > full.width) continue;
    const img = sharp(buf).resize({ width: w, kernel: "lanczos3" }).webp({ quality, alphaQuality });
    sources.push(await save(img, dir, `${name}-${w}`));
  }
  if (!sources.length || sources.at(-1).w < full.width) {
    sources.push(await save(sharp(buf).webp({ quality, alphaQuality }), dir, `${name}-${full.width}`));
  }
  return { ...sources.at(-1), sources };
}

async function isTransparent(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = (x, y) => data[(y * info.width + x) * 4 + 3];
  return [a(0, 0), a(info.width - 1, 0), a(0, info.height - 1), a(info.width - 1, info.height - 1)].every((v) => v < 10);
}

/**
 * Trimmed render buffer + the head's horizontal centre (0–1) from the alpha of the top band.
 * `solidify` firms up cut-outs whose figure is slightly translucent (alpha just under 255
 * everywhere), keeping a short soft ramp at the edges.
 */
async function loadRender(file, { solidify = false } = {}) {
  const trimmed = await sharp(file).ensureAlpha().trim({ threshold: 2 }).png().toBuffer({ resolveWithObject: true });
  const { data, info } = await sharp(trimmed.data).raw().toBuffer({ resolveWithObject: true });
  if (solidify) {
    for (let i = 3; i < data.length; i += 4) data[i] = Math.max(0, Math.min(255, Math.round(((data[i] - 30) * 255) / 150)));
    trimmed.data = await sharp(data, { raw: info }).png().toBuffer();
  }
  // Head band: rows 3%–9% of the figure; take the median x of solid pixels.
  const xs = [];
  for (let y = Math.floor(info.height * 0.03); y < info.height * 0.09; y++) {
    for (let x = 0; x < info.width; x += 2) if (data[(y * info.width + x) * 4 + 3] > 180) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  const headX = xs.length ? xs[Math.floor(xs.length / 2)] / info.width : 0.5;
  return { buf: trimmed.data, w: info.width, h: info.height, headX };
}

/** Scene file → resized buffer (watermarks cropped). */
async function loadScene(name) {
  const s = scenes[name];
  const file = src(s.file);
  const meta = await sharp(file).metadata();
  const [l, t, r, b] = s.crop ?? [0, 0, 0, 0];
  const box = {
    left: Math.round((meta.width * l) / 100),
    top: Math.round((meta.height * t) / 100),
    width: Math.round(meta.width * (1 - (l + r) / 100)),
    height: Math.round(meta.height * (1 - (t + b) / 100)),
  };
  return sharp(file).extract(box).resize({ width: Math.min(box.width, 2560), withoutEnlargement: true }).toBuffer();
}

/**
 * Bust composite: the render scaled so the figure is `figureScale` × frame height,
 * head near the top, centred on the head; the scene behind it dimmed.
 */
async function bust({ render, sceneBuf, W, H, figureScale, top, dim = 0.5, opaqueImage }) {
  let bg;
  if (sceneBuf) {
    bg = await sharp(sceneBuf).resize(W, H, { fit: "cover", position: "centre" }).blur(2).modulate({ brightness: dim, saturation: 0.85 }).toBuffer();
  } else {
    bg = await sharp({ create: { width: W, height: H, channels: 3, background: "#16130f" } }).png().toBuffer();
  }
  const layers = [];
  if (opaqueImage) {
    layers.push({ input: await sharp(opaqueImage).resize(W, H, { fit: "cover", position: "north" }).toBuffer(), left: 0, top: 0 });
  } else {
    const scale = (H * figureScale) / render.h;
    const rw = Math.round(render.w * scale), rh = Math.round(render.h * scale);
    const scaled = await sharp(render.buf).resize(rw, rh, { kernel: "lanczos3" }).toBuffer();
    // Place so the head centre sits at the frame's horizontal centre; clip to the frame.
    const left = Math.round(W / 2 - render.headX * rw);
    const topPx = Math.round(H * top);
    const cut = {
      left: Math.max(0, -left),
      top: 0,
      width: Math.min(rw, W - left) - Math.max(0, -left),
      height: Math.min(rh, H - topPx),
    };
    const piece = await sharp(scaled).extract(cut).toBuffer();
    layers.push({ input: piece, left: Math.max(0, left), top: topPx });
  }
  // Soft darkening toward the bottom for text.
  layers.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#0b0a09" stop-opacity="0"/><stop offset="1" stop-color="#0b0a09" stop-opacity=".9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
    ),
    left: 0,
    top: 0,
  });
  return sharp(bg).composite(layers).webp({ quality: 84 });
}

// ── Clean previous (mockup-derived) art ────────────────────────
for (const d of ["characters", "environments", "gallery", "scenes", "banners"]) {
  const p = path.join(pub, d);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

// ── Scenes ─────────────────────────────────────────────────────
const sceneBufs = {};
for (const name of Object.keys(scenes)) {
  sceneBufs[name] = await loadScene(name);
  manifest.scenes[name] = await saveResponsive(sceneBufs[name], "scenes", name, [960, 1440, 1920, 2560]);
}

// ── Banners ────────────────────────────────────────────────────
for (const [name, file] of Object.entries(banners)) {
  const img = sharp(src(file)).resize({ width: 2560, withoutEnlargement: true });
  manifest.banners[name] = await save(img.webp({ quality: 84 }), "banners", name);
  console.log(`banner ${name} ${manifest.banners[name].w}x${manifest.banners[name].h}`);
}

// ── Lead characters ────────────────────────────────────────────
for (const [id, cfg] of Object.entries(leads)) {
  // Figures supplied for this project are soft-edged throughout, so they are firmed up.
  const render = await loadRender(src(cfg.render), { solidify: cfg.render.startsWith("local:") });
  if (cfg.headX !== undefined) render.headX = cfg.headX;
  // A hero figure is shown at most ~700px wide, so 1400 covers a 2x screen.
  const rh = Math.min(render.h, 3000);
  const rw = Math.round((render.w * rh) / render.h);
  const sized = await sharp(render.buf).resize(rw, rh).png().toBuffer();
  const renderOut = await saveResponsive(sized, `characters/${id}`, "render", [360, 560, 720, 900, 1400], { quality: 84, alphaQuality: 90 });
  const sceneBuf = sceneBufs[cfg.scene];
  const portrait = await save(await bust({ render, sceneBuf, W: 800, H: 1200, figureScale: 2.1, top: 0.07 }), `characters/${id}`, "portrait");
  const card = await save(await bust({ render, sceneBuf, W: 900, H: 600, figureScale: 2.5, top: 0.08, dim: 0.62 }), `characters/${id}`, "card");
  manifest.characters[id] = {
    render: { ...renderOut, headX: +render.headX.toFixed(3) },
    scene: cfg.scene,
    portrait: portrait.src,
    card: card.src,
  };
  console.log(`lead ${id.padEnd(10)} render ${renderOut.w}x${renderOut.h} in ${renderOut.sources.length} sizes, headX ${render.headX.toFixed(2)}`);
}

// ── Per-character plates ───────────────────────────────────────
// Official art found on the wiki for each directory character: one image for the
// biography band (early life or family where such art exists), five for the gallery
// strip, and a pool for the Key moments rail. Sources are bio-/gal-/mom- in
// sources.json; anything a character has no art for is simply left out.
const PLATE_SIZES = {
  bio: { widths: [720, 1100, 1440], quality: 82 },
  gallery: { widths: [520, 900, 1440], quality: 80 },
  // The rail's frames are 5:3 and small. Cropping to that here, on the most
  // detailed part of the picture, beats letting CSS centre-crop a figure that
  // was drawn to one side of an empty canvas.
  moments: { widths: [320, 560], quality: 78, crop: 5 / 3 },
};

/** Mean luminance the plates are graded to, so they sit on the dark sections together. */
const PLATE_TARGET = 88;

/**
 * Concept art is often drawn on white, which glares against the archive's near-black
 * sections. Each plate is pulled towards a common luminance and slightly desaturated,
 * so a pale architectural sketch and a night scene read as part of one set. Art that
 * is already dark enough is left alone.
 */
async function grade(buf) {
  const { channels } = await sharp(buf).stats();
  const [r, g, b] = channels;
  const mean = 0.2126 * r.mean + 0.7152 * g.mean + 0.0722 * b.mean;
  const brightness = Math.min(1, Math.max(0.42, PLATE_TARGET / mean));
  return sharp(buf)
    .modulate({ brightness, saturation: 0.9 })
    .linear(1.08, -8)
    .toBuffer();
}

/** The cached file for a source name, or undefined when it was never fetched. */
const optional = (name) => {
  try {
    return src(name);
  } catch {
    return undefined;
  }
};

for (const id of Object.keys(leads)) {
  const entry = manifest.characters[id];
  const plate = async (file, kind, name) => {
    const { widths, quality, crop } = PLATE_SIZES[kind];
    const max = Math.max(...widths);
    // Cap at the largest size actually served, or saveResponsive keeps a full-size
    // copy as well — 1600px masters for thumbnails nobody sees above 560.
    const sized = crop
      ? await sharp(file).resize(max, Math.round(max / crop), { fit: "cover", position: sharp.strategy.attention }).toBuffer()
      : await sharp(file).resize({ width: max, withoutEnlargement: true }).toBuffer();
    return saveResponsive(await grade(sized), `characters/${id}/plates`, name, widths, { quality });
  };

  const bioFile = optional(`bio-${id}`);
  if (bioFile) entry.bio = await plate(bioFile, "bio", "bio");

  const gallery = [];
  for (let i = 1; i <= 5; i++) {
    const f = optional(`gal-${id}-${i}`);
    if (f) gallery.push(await plate(f, "gallery", `gal-${i}`));
  }
  if (gallery.length) entry.gallery = gallery;

  const moments = [];
  for (let i = 1; i <= 8; i++) {
    const f = optional(`mom-${id}-${i}`);
    if (f) moments.push(await plate(f, "moments", `mom-${i}`));
  }
  if (moments.length) entry.moments = moments;

  console.log(`plates ${id.padEnd(10)} bio ${entry.bio ? "yes" : "—"}, gallery ${gallery.length}, moments ${moments.length}`);
}

// ── Supporting characters ──────────────────────────────────────
// No usable official portrait: Marcello's is a sliver of a film frame, Tessa's is manga art.
const skipSupporting = new Set(["marcello-auditore", "tessa-kenway"]);
for (const [id, era] of Object.entries(supportingEra)) {
  if (skipSupporting.has(id)) continue;
  let file;
  try {
    file = src(`sup-${id}`);
  } catch {
    continue;
  }
  const sceneBuf = sceneBufs[eraScene[era]];
  const transparent = await isTransparent(file);
  const job = transparent
    ? await bust({ render: await loadRender(file), sceneBuf, W: 480, H: 720, figureScale: 2.1, top: 0.07 })
    : await bust({ sceneBuf, W: 480, H: 720, opaqueImage: file });
  manifest.characters[id] = { portrait: (await save(job, `characters/${id}`, "portrait")).src };
  console.log(`sup  ${id.padEnd(20)} ${transparent ? "render" : "photo"}`);
}

writeFileSync(path.join(pub, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("manifest written");
