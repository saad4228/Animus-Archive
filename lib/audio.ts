import fs from "node:fs";
import path from "node:path";

/**
 * Every audio file in public/audio/ becomes a track, in filename order, titled
 * from its filename ("01-ezios-family.mp3" → "Ezios Family"). For exact titles,
 * add public/audio/tracks.json: { "01-ezios-family.mp3": "Ezio's Family" }.
 *
 * Server-only: the player is a client component and gets the list as props.
 */
export interface Track {
  src: string;
  title: string;
}

const DIR = path.join(process.cwd(), "public", "audio");
const EXTS = [".mp3", ".m4a", ".aac", ".ogg", ".opus", ".wav"];

function titleFromFilename(file: string) {
  const name = path
    .basename(file, path.extname(file))
    .replace(/^[\s._-]*\d+[\s._-]+/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

export function getTracks(): Track[] {
  if (!fs.existsSync(DIR)) return [];

  let titles: Record<string, string> = {};
  const overrides = path.join(DIR, "tracks.json");
  if (fs.existsSync(overrides)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(overrides, "utf8"));
      if (parsed && typeof parsed === "object") titles = parsed as Record<string, string>;
    } catch {
      // A malformed tracks.json just means derived titles.
    }
  }

  return fs
    .readdirSync(DIR)
    .filter((f) => EXTS.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .map((f) => ({
      src: `/audio/${encodeURIComponent(f)}`,
      title: typeof titles[f] === "string" ? titles[f] : titleFromFilename(f),
    }));
}
