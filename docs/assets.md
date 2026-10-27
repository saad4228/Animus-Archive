# Asset manifest

All character and setting art is **official Assassin's Creed artwork** (character renders,
database portraits and concept art by Ubisoft and its artists), downloaded from the
[Assassin's Creed Wiki](https://assassinscreed.fandom.com) where it is hosted. It is used here
for an unofficial, non-commercial fan archive; all rights remain with Ubisoft. Every source URL
is listed in `scripts/art/sources.json`.

The mockup-derived crops used earlier are gone.

## How it works

```bash
npm run art:fetch   # download every source in scripts/art/sources.json into .art-cache/ (git-ignored)
npm run art:build   # compose the site's images + public/images/manifest.json
```

`scripts/art/build.mjs` produces, per character:

| Output | What it is | Used in |
| --- | --- | --- |
| `characters/<id>/render-<w>.<hash>.webp` | Transparent full-figure render, trimmed, at five widths (360–1400), with its detected head position | Home hero, profile hero, Relationships banner |
| `characters/<id>/portrait.<hash>.webp` | 2:3 bust: the render over its own (dimmed) setting, framed on the head | Directory cards, search, map nodes, bookmarks, gallery |
| `characters/<id>/card.<hash>.webp` | 3:2 bust, same composition | Home featured strip |
| `characters/<id>/plates/bio-<w>.<hash>.webp` | One piece of official art for the biography band — early life or family where such art exists | Biography |
| `characters/<id>/plates/gal-<n>-<w>.<hash>.webp` | Five pieces of official art: concept art, key art, promotional art | Gallery strip and lightbox |
| `characters/<id>/plates/mom-<n>-<w>.<hash>.webp` | A pool of eight, cycled over the character's key moments | Key moments rail |
| `scenes/<name>-<w>.<hash>.webp` | Setting art at four widths (960–2560), watermarks cropped | Hero backgrounds, legacy, era timeline |
| `banners/<name>.<hash>.webp` | Wide page banner, ≤ 2560 px | Top of the Characters page (`banners.characters`) |

Hashed filenames mean a changed image always gets a new URL, so `/images/*` is served with a
one-year immutable cache (`next.config.ts`).

**Figures and settings are served straight from `public/`**, not through `next/image`: each is
written at several widths and chosen with `srcset`, so nothing is resized at request time. That
took the hero figure from roughly 1.5 s to around 100 ms, and halved the homepage's image
weight. `components/scene/Scene.tsx` is therefore a deliberate plain `<img>`; cards and
portraits, which are small, still use `next/image`.
Scenes are composed with the render **at runtime** (`components/scene/Scene.tsx`): the figure is
placed by its head, never stretched, and the setting can be zoomed from an anchor per character
(`framing.scene` in `data/characters.ts`) so its landmark clears the figure.

### Finding the plates

`bio-`, `gal-` and `mom-` sources were chosen by searching the wiki's File namespace per
character (concept art, key art, promotional art, plus `Young <name>` and family terms for the
biography slot), then scoring candidates on size, aspect, and whether the title belongs to that
character's own games. deviantART-style uploads are excluded — the archive shows official art
only — and no image is used on two characters' pages. URLs point at the wiki's own scaled
renderings rather than the originals, several of which are 8000px masters.

Art supplied directly by the project owner lives in `scripts/art/local/` (checked in) and is
referenced as `local:<name>` in `scripts/art/build.mjs` — `<id>-figure.png` for a character
model, `<id>-<place>.png` for a setting. A supplied figure becomes that character's model
**everywhere**: homepage, profile hero, directory card, portrait and relationship-map node.
These cut-outs are soft-edged throughout, so the build firms up their alpha (`solidify`).

**Homepage composition** is one shared recipe, `wideHome()` in `data/characters.ts`: the whole
setting edge to edge (nothing cropped) over a blurred copy of itself, starting 22% across so the
banner at the image's left edge sits beside the headline, with the figure centre-right. Each
character can override just what differs — usually `figureHeight`, or `sceneTop` for an unusually
wide image.

## Mapping

| Character | Render | Setting |
| --- | --- | --- |
Settings marked **(user)** were supplied by the project owner and live in `scripts/art/local/`.

| Altaïr | AC1 render | Masyaf fortress **(user)** `altair-masyaf.png` |
| Ezio | Brotherhood render | Florence at sunset **(user)** `ezio-florence.png` |
| Connor | **(user)** `connor-figure.png` | Frontier overlook **(user)** `connor-frontier.png` |
| Edward | **(user)** `edward-figure.png` (an earlier back view is kept as `edward-back.png`) | Harbour in daylight **(user)** `edward-harbour.png` (an earlier sunset version is kept as `edward-harbour-sunset.png`) |
| Adéwalé | Freedom Cry render | Black Flag harbour concept (Rez) |
| Haytham | **(user)** `haytham-figure.png` | 1750s New York, Rogue concept |
| Shay | Rogue render | North Atlantic, Rogue concept |
| Aveline | Liberation render | New Orleans panorama (Eddie Bennun), watermark cropped |
| Arno | **(user)** `arno-figure.png` | Paris and Notre-Dame **(user)** `arno-paris.png` |
| Jacob, Evie | Syndicate renders | Victorian London **(user)** `frye-london.png` (shared) |
| Bayek | Origins render | Siwa, Origins concept |
| Kassandra | Odyssey render (no helmet) | Aegean harbour **(user)** `kassandra-aegean.png` — much wider than the rest, so it sits lower (`sceneTop`) |
| Alexios | Odyssey render (no helmet) | Greek mountain valley **(user)** `alexios-greece.png` |
| Eivor | Valhalla render (female) | Norwegian fjord **(user)** `eivor-norway.png` |
| Basim | Valhalla render | Baghdad rooftops **(user)** `basim-baghdad.png` |
| Naoe | Shadows render | Castle town at sunset **(user)** `naoe-iga.png` |
| Yasuke | Shadows render | Kyoto in winter, Shadows concept |
| Desmond | **(user)** `desmond-figure.png` | Grand Temple (AC III Nexus concept) |
| Layla | **(user)** `layla-figure.png` | Yggdrasil, Valhalla concept |

Supporting characters use the main image of their wiki page (usually an official render).
No usable official image exists for **Bernard Kenway, Linette Kenway, Sef, Marcello Auditore
and Tessa Stephenson-Oakley** (Tessa's only image is manga-style art); they show the designed
initials state. The gallery section stays hidden until gallery images are added.

## Emblems and the site mark

Three marks are traced into SVG paths (`components/ui/emblem-paths.ts`) rather than used as
images, so they stay crisp from 16 px on a card to 480 px as a watermark and take their colour
from the surrounding text:

| Source in `scripts/art/local/` | Where it appears |
| --- | --- |
| `emblem-seal.png` | The site mark: header logo, footer, "All eras" tile, 404 page |
| `emblem-brotherhood.png` | Above the name of every Assassin / Hidden One |
| `emblem-templar.png` | Above the name of every Templar |

```bash
npm run art:emblems   # re-trace after replacing any of those PNGs
```

The site mark is the logo's insignia with its wordmark cropped off, since the header shows the
site's own name beside it. The header logo links to the homepage from every page.

Characters who are neither Assassin nor Templar — Kassandra, Alexios, Eivor — keep the original
compass star.

## Music

Drop audio files in **`public/audio/`**. Every file there becomes a track in the header player,
in filename order — no code change needed.

```
public/audio/01-ezios-family.mp3
public/audio/02-animus.mp3
```

Accepted: `.mp3` (safest), `.m4a`, `.aac`, `.ogg`, `.opus`, `.wav`. Track titles are derived from
the filename (a leading number is stripped, dashes become spaces). For exact titles, add
`public/audio/tracks.json`:

```json
{
  "01-ezios-family.mp3": "Ezio's Family",
  "02-animus.mp3": "Animus"
}
```

With no files in the folder the player renders nothing and the header looks as it did before.

**Autoplay:** browsers block sound until the visitor has interacted with the site, so the player
tries to start immediately and otherwise starts on their first click, key press or scroll. A pause
the visitor chooses is never overridden. Volume is 0.07 — background level, with the visitor's
own volume doing the rest. Mute and the current track are remembered per browser, and playback
continues across page navigation.

Music is copyrighted. Use tracks you have the right to use on a non-commercial fan page.
