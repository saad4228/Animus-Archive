// npm run art:fetch
// Downloads every source in scripts/art/sources.json into .art-cache/ (skipping files already
// there). Sources are official art hosted on the Assassin's Creed Wiki; see docs/assets.md.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "scripts", "art", "sources.json");
const dir = path.join(process.cwd(), ".art-cache");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8").replace(/^﻿/, ""));
mkdirSync(dir, { recursive: true });

const TYPE_EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };

/**
 * The wiki's scaled renderings end in the pixel width, not a filename, so the
 * extension comes from the original name inside the path, then the response type.
 */
const guessExt = (url) => {
  const m = new URL(url).pathname.match(/\.(jpe?g|png|webp|gif)(?=\/|$)/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : "";
};

const existing = new Set(readdirSync(dir).map((f) => f.replace(/\.[^.]+$/, "")));
let ok = 0;
let failed = 0;

for (const [name, url] of Object.entries(manifest)) {
  if (existing.has(name)) continue;
  let res;
  try {
    res = await fetch(url, { headers: { "User-Agent": UA } });
  } catch (e) {
    console.log(`FAIL ${name}: ${e.message}`);
    failed++;
    continue;
  }
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!res.ok || !type.startsWith("image/")) {
    console.log(`FAIL ${name}: ${res.status} ${type}`);
    failed++;
    continue;
  }
  const ext = guessExt(url) || TYPE_EXT[type] || ".img";
  writeFileSync(path.join(dir, name + ext), Buffer.from(await res.arrayBuffer()));
  ok++;
  if (ok % 25 === 0) console.log(`  …${ok} downloaded`);
}
console.log(`fetched ${ok}, failed ${failed}, already present ${existing.size}`);
