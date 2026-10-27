# How The Animus Archive is built

A walk through the whole project: what each layer does, why it is shaped that
way, and which decisions are worth talking about.

Read it top to bottom once. After that, the file map in section 8 is the part to
come back to.

---

## 1. The thirty-second version

> It's a character encyclopaedia for *Assassin's Creed* — 20 profiles across ten
> historical eras, with a relationship map connecting 72 people.
>
> It's Next.js 16 on the App Router with React 19, TypeScript and Tailwind 4.
> Every page is prerendered at build time, so there's no database and no server
> work per request. The artwork — 926 files — is composed ahead of time by a
> `sharp` pipeline that writes each image at five widths with a content hash in
> the filename, so nothing is resized when someone visits and the files cache
> forever.
>
> The part I'd point at is the relationship map. It isn't a graph library — it
> measures the rendered DOM boxes and draws its own SVG connector lines, so they
> stay attached at any screen width. And the family relationships are derived
> rather than stored: 92 edges in the data produce every sibling, half-sibling
> and grandchild on the site.

That paragraph is the whole interview answer. Everything below is the detail
behind it, so you can keep going when they ask follow-ups.

---

## 2. The stack, and why each piece

| Choice | Why |
| --- | --- |
| **Next.js 16, App Router** | Server Components mean the data layer never ships to the browser. The 844-line character file is read at build time and only rendered HTML goes out. |
| **React 19** | `useSyncExternalStore` for reading `localStorage` without a hydration flash. |
| **TypeScript** | The data *is* the product here. `data/types.ts` is the contract that stops a typo in one of 72 records from reaching the page. |
| **Tailwind 4** | CSS-first config — design tokens are plain CSS custom properties in `globals.css`, no JS config file. |
| **`sharp`, at build time** | Image work belongs in the build, not in a request handler. |
| **No database** | The data is 72 records that change when a game ships. A database would be infrastructure to maintain for no gain. |
| **No state library** | There are exactly two pieces of global client state — bookmarks and audio preferences. Both are ~50 lines over `useSyncExternalStore`. |

**The honest version of "why no database":** for a dataset this size and this
static, a TypeScript file *is* the better database. It's type-checked, diffable
in git, and free to query. If the archive grew to thousands of entries with user
contributions, that answer changes.

---

## 3. The one rule the whole project follows

Four layers, and dependencies only ever point downward:

```
app/          routes — compose components, decide what a page contains
   |
components/   presentation — how things look
   |
lib/          logic — derive, search, sort, group, measure
   |
data/         facts — typed records, no React, no styling, no logic
```

`data/` doesn't know React exists. `lib/` doesn't know JSX exists. Nothing in
`components/` reads a raw data file — it goes through `lib/`.

**Why this matters in an interview:** it's the answer to "how do you keep a
project maintainable?" that is actually demonstrable. Ask "where does this code
go?" and the layering answers it.

`scripts/` sits outside all of this. It runs on a developer's machine, writes
files into `public/`, and never ships.

---

## 4. Layer by layer

### 4.1 `data/` — the facts

| File | Lines | What it holds |
| --- | --- | --- |
| `types.ts` | 190 | Every interface. Start here when reading the project. |
| `characters.ts` | 844 | 72 people. 20 have full profiles; the rest exist to be related to. |
| `relationships.ts` | 125 | 92 edges — the entire social graph. |
| `catalog.ts` | 59 | The 16 games and 10 eras, each with a sort key. |

**The design idea worth explaining: progressive data.**

A character is not all-or-nothing. The `Character` interface has a handful of
required fields and everything else optional:

```ts
interface Character {
  id: string;  name: string;  gender: Gender;
  faction: Faction;  affiliations: string[];  role: string;
  games: GameId[];  directory: boolean;
  born?: HistDate;   died?: HistDate;   quote?: Quote;
  dossier?: Dossier;   timeline?: TimelineEvent[];   // ...
}
```

Right now **20 characters have profiles, 20 have checked timelines, but only 2
have the full hand-written `dossier`.** The other 18 profiles render perfectly —
sections they lack simply don't appear, and the ones that remain fall back:

```tsx
const closing = d?.closingQuote ?? c.quote;      // Legacy.tsx
{d?.legacy ?? c.role}
```

And in the profile route, the section list is built from what exists:

```tsx
const sections = [
  { id: "overview", label: "Overview" },
  { id: "biography", label: d ? "Biography" : "Summary" },
  ...(timeline.length  ? [{ id: "moments",       label: "Key moments"   }] : []),
  ...(showRelations    ? [{ id: "relationships", label: "Relationships" }] : []),
  ...(showGallery      ? [{ id: "gallery",       label: "Gallery"       }] : []),
  { id: "legacy", label: "Legacy" },
];
```

> **Say this:** "There is no `if (character.id === 'ezio')` anywhere in the
> codebase. Every page is built from whatever data that character has. Adding a
> biography is a data edit, not a code change."

That is the most important thing about the project and the easiest to
demonstrate — open any two profiles side by side.

**The second idea: a date you don't know is not a date.**

```ts
interface HistDate {
  year: number;
  bce?: boolean;      // 49 BCE
  approx?: boolean;   // c. 1165
  exact?: string;     // "24 June 1459"
  after?: boolean;    // died after 1524
}
```

Uncertainty is modelled, not flattened. A character whose death year is unknown
gets `b. 1459`, not `1459 – ?`. The encyclopaedia never invents a fact to fill a
slot.

---

### 4.2 `lib/` — the logic

This is where the actual programming is. Every file here is pure functions over
`data/`, which also means every one is trivially testable.

#### `relations.ts` (162 lines) — the social graph

The most interesting file in the project.

**Siblings are derived, not stored.** The data has 92 edges. Rather than writing
a `sibling` edge for every pair, the code finds anyone who shares a recorded
parent:

```ts
const myParents = new Set(parentsOf(id).map((p) => p.person.id));
for (const parent of myParents) {
  for (const { person } of childrenOf(parent)) {
    const theirParents = new Set(parentsOf(person.id).map((p) => p.person.id));
    const half =
      [...myParents].some((p) => !theirParents.has(p)) &&
      [...theirParents].some((p) => !myParents.has(p));
    // ...
  }
}
```

Note what `half` is doing. It only says "half-brother" when **both** people have
a parent the other doesn't. If you only know one parent for each, you know they
share a parent — you don't know they *don't* share the other. So it says
"brother". **The data model refuses to claim more than it knows.**

That's a good thing to be asked about, because it's a correctness decision
rather than a coding trick.

`groupsFor(id)` then sorts everyone into the six slots the map draws, handling:

- **direction** — a `mentor` edge means "mentor" looking one way and "student"
  the other, so it lands in `mentors` or `next` depending which end you're on
- **the same person in two roles** — Mario Auditore is Ezio's uncle *and* his
  mentor, so he appears in both slots, and within a slot roles are joined
  (`"Uncle · Mentor"`)
- **two generations down** — grandchildren are walked automatically and labelled
  `"Through Flavia"`

#### `typeset.ts` (93 lines) — fitting a name to its column

The problem: profile headings are set in Cinzel caps and must fill their column
on **one line**. "EVIE FRYE" and "RATONHNHAKÉ:TON" cannot take the same font
size. Viewport units guess, and the long name wraps.

The fix is to measure the font. The file holds the advance width of every
uppercase glyph, in em:

```ts
const CINZEL: Record<string, number> = {
  I: 0.338,  J: 0.324,  S: 0.475,  A: 0.712,  M: 0.931,  W: 0.982,  // ...
};

export function fitCaps(text: string, { maxPx = 54, minPx = 20, fill = 0.92 } = {}) {
  const em = cinzelEm(text);
  return `clamp(${minPx}px, calc(100cqw * ${fill} / ${em.toFixed(2)}), ${maxPx}px)`;
}
```

Two details worth noticing:

- **`100cqw`, not `100vw`** — a container query unit, so it's a percentage of
  *the text column*, not the window. That makes it exact at every width instead
  of calibrated to one breakpoint.
- **An unmeasured glyph falls back to `0.8`, a wide-ish value** — so an unknown
  character errs towards a *smaller* heading. Failing safe: too small is ugly,
  too big wraps and breaks the layout.

This produces pure CSS. No JavaScript runs in the browser to size the heading.

#### `search.ts` (75 lines) — weighted search, no dependency

Accents and punctuation are stripped before comparison, so `altair` finds
**Altaïr** and `ratonhnhaketon` finds **Ratonhnhaké:ton**.

Each character exposes weighted fields — name 10, alias 8, game 5, era 4,
affiliation 2 — and each query word scores by *how* it matched:

| Match | Multiplier |
| --- | --- |
| The field starts with the word | 3 |
| A word inside the field starts with it | 2 |
| It appears anywhere (3+ letters) | 1 |

**Every query word must match something**, so `black flag` narrows rather than
widens. The result carries `matched` — which field won — so the UI can show
*why* something appeared.

> Why not Fuse.js? 75 lines, no dependency, and it ranks on the fields that
> matter here. A library would be the right call at ten thousand records.

#### `bookmarks.ts` / `history.ts` — client state without a library

Both use the same shape: a module-level variable, a `Set` of listeners, and
`useSyncExternalStore`.

```ts
export function useBookmarks() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  // ...
}
```

Three things to point out:

1. **The third argument is the server snapshot.** The server can't read
   `localStorage`, so it returns `EMPTY`. This is what prevents a hydration
   mismatch and the flash of a wrong bookmark icon.
2. **Every storage access is wrapped in `try/catch`.** Private mode and blocked
   cookies throw on `localStorage.getItem`. The feature degrades to in-memory
   for the visit instead of crashing the page.
3. **`subscribe` also listens for the `storage` event** — bookmark someone in
   one tab and the other tab updates.

`history.ts` is a smaller, stranger one: it mirrors the browser's history stack
so the back button can tell whether you arrived from inside the site or landed
directly. Entries are keyed by the **Navigation API**'s `currentEntry.key` where
available, falling back to the pathname, so going *back* truncates the stack
correctly regardless of the order `popstate` and React rendering happen in.

#### `art.ts` (93 lines) — the artwork lookup

Reads `public/images/manifest.json` and returns a complete `Art` object for a
character — or `NO_ART` if the manifest has nothing. Callers never deal with
`undefined` lists:

```ts
export const NO_ART: Art = { gallery: [], moments: [] };

export function getArt(id: string): Art {
  const e = characters[id];
  if (!e) return NO_ART;
  return { ...e, scene: e.scene ? scenes[e.scene] : undefined,
           gallery: e.gallery ?? [], moments: e.moments ?? [] };
}
```

Scenes are stored *by key* and resolved on read, so twenty characters sharing
Florence reference one image rather than twenty copies.

#### `data.ts` (76 lines) — formatting and ordering

Lookup map, `lifespan()`, `chronoKey()` (negative years for BCE, so a single
numeric sort handles 431 BCE through 2018 CE), and the derived lists
`directoryCharacters` and `featuredCharacters`.

---

### 4.3 `components/` — presentation

**12 are Server Components. 14 are Client Components.** That split is the thing
to understand, because it's the whole point of the App Router.

A component is only `"use client"` if it needs **state, an event handler, or the
DOM**. Everything else renders to HTML at build time and ships zero JavaScript.

| Server (no JS shipped) | Client (`"use client"`) |
| --- | --- |
| `Scene`, `ProfileHero`, `Legacy`, `KeyMoments` | `Directory` — filter state |
| `CharacterCard`, `Portrait`, `Emblem` | `RelationshipMap` — DOM measurement |
| `Cartouche`, `Compass`, `SectionHeading` | `Gallery` — lightbox |
| `SiteFooter`, `encoding` | `SearchBox`, `MusicPlayer`, `SectionNav` |

> **Say this:** "The relationship map is a client component because it measures
> the DOM. The character cards aren't, because they're just markup — so they
> cost nothing in the bundle."

#### `RelationshipMap.tsx` (307 lines) — the centrepiece

Six groups sit in fixed CSS-grid slots around the focused person: family above,
mentors left, allies right, love lower-left, rivals lower-right, next generation
below. **Slot ids double as `grid-area` names**, which is why the layout code is
so short.

The lines between them are the interesting part. There is no graph library and
no hardcoded coordinates — it measures the rendered boxes:

```tsx
useLayoutEffect(() => {
  const measure = () => {
    const w = wrap.getBoundingClientRect();
    const c = circleRef.current?.getBoundingClientRect();
    // nearest point on the target box to the focus centre
    const px = Math.min(Math.max(cx, bx.l), bx.r);
    const py = Math.min(Math.max(cy, bx.t), bx.b);
    // ...
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(wrap);
  for (const el of Object.values(boxRefs.current)) if (el) ro.observe(el);
  return () => ro.disconnect();
}, [focusId]);
```

Four decisions in there:

1. **`useLayoutEffect`, not `useEffect`** — it runs before the browser paints, so
   lines never appear in the wrong place for a frame.
2. **`Math.min(Math.max(...))` clamps the focus centre onto the box** — the
   standard "nearest point on a rectangle" trick, two lines instead of a
   geometry library.
3. **Lines heading downward exit through the focus block's edge**, not the
   circle's, because the name label sits under the portrait and a line through
   text looks broken.
4. **`ResizeObserver` watches each box, not just the wrapper** — a box can reflow
   on its own when text wraps or when the web font finishes loading, without the
   wrapper ever changing size. That is the bug observing only the container
   would miss.

The same component serves both the profile section and the full Relationships
page, switched by one prop:

```tsx
mode: "profile" | "explore"   // link to a profile, or re-centre the map
```

#### `Scene.tsx` (106 lines) — a character in their world

Two layers: the setting fills the frame; a transparent cut-out of the character
stands in it. The figure is positioned **by its head**:

```tsx
<div className={`absolute ${figureClass}`}
     style={{ aspectRatio: `${r.w} / ${r.h}`,
              transform: `translateX(-${r.headX * 100}%)` }}>
```

`headX` is the horizontal centre of the head, 0–1 across the render, detected by
the build script. The CSS positions where the *head* should land and the
transform shifts the image to put it there. The figure is therefore never
squashed, stretched, or cropped through the face at any screen size.

Also note the deliberate `eslint-disable` at the top of the file:

```
/* eslint-disable @next/next/no-img-element --
   These are deliberately plain <img>: scripts/art/build.mjs already emits each
   figure and setting at several widths as static WebP, so routing them through
   next/image would only add a resize at request time. */
```

> **Say this:** "I use `next/image` for the cards and portraits, and plain `<img>`
> with `srcset` for the hero art — because that art is already pre-sized at build
> time with a content hash. Running it through the image optimiser would add work
> at request time for an identical result."
>
> That's a stronger answer than "I used next/image everywhere."

#### `Directory.tsx` (344 lines) — filtering

The filter semantics, stated as a comment in the file and then implemented
directly:

> **AND across groups, OR within a group:**
> `(protagonist OR modern) AND (templar) AND era AND game AND bookmarked AND query`

```tsx
const results = useMemo(() => {
  const list = (q ? search(directoryCharacters, q).map((h) => h.character)
                  : directoryCharacters)
    .filter((c) =>
      (era === "all" || c.era === era) &&
      (!roles.size || [...roles].some((r) => roleMatch[r](c))) &&
      (!factions.size || factions.has(c.faction)) &&
      (game === "all" || c.games.includes(game)) &&
      (!savedOnly || isBookmarked(c.id)));
  return q ? list : [...list].sort(sortBy[sort]);   // relevance wins while searching
}, [era, roles, factions, game, savedOnly, q, sort, isBookmarked]);
```

`roleMatch` and `sortBy` are lookup objects at module scope rather than `switch`
statements, and `eraCounts` is computed once at module load because the data is
fixed. Small things, but they're the difference between "works" and "considered".

Note the last line: **while you're searching, relevance order wins and the sort
buttons are disabled.** Sorting search results alphabetically would throw away
the ranking the search just computed.

---

### 4.4 `app/` — the routes

| Route | Rendering |
| --- | --- |
| `/` | Static |
| `/characters` | Static |
| `/characters/[slug]` | Static for all 20, via `generateStaticParams()` |
| `/relationships` | Static shell, client explorer |
| `/sitemap.xml`, `/robots.txt` | Generated from the character list |
| `/icon.svg`, `/apple-icon.png` | Generated by file convention |

`layout.tsx` holds the header — so **music keeps playing across navigation**,
because the audio element never unmounts — plus metadata and `metadataBase`:

```ts
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
```

**That is read at build time, not runtime** — Next bakes metadata into the
prerendered HTML. Changing the variable requires a redeploy. Worth knowing,
because it looks like runtime config and isn't.

One line in the profile route is worth being able to explain:

```tsx
export const ensureStatic = "navigation";
```

Profiles are fully static. It also makes an unknown slug wait for the whole page
rather than streaming, so `notFound()` can answer with a **real HTTP 404** rather
than a 200 with error content inside it — which matters for search engines.

---

### 4.5 `scripts/art/` — the build-time pipeline

Runs on a developer machine. Never ships.

```
npm run art:fetch    # pull official art into .art-cache/ (git-ignored)
npm run art:build    # compose public/images/ + manifest.json
```

`build.mjs` (361 lines) produces, from ~200 source images:

- **926 files, 54 MB** — every render at five widths (360 / 560 / 720 / 900 /
  1155), every scene, portrait, card and biography plate, 100 gallery plates and
  160 timeline plates
- **`manifest.json`** — the index `lib/art.ts` reads

Four techniques in it:

**Content-hashed filenames.** Every output is written as
`images/<dir>/<name>.<hash>.webp`, paired with a header in `next.config.ts`:

```ts
{ source: "/images/:path*",
  headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }
```

A URL's content can never change, so the browser is told to cache it for a year
and never revalidate. Change the art and the filename changes. **That is the
entire cache-busting strategy, in two pieces.**

**Luminance grading.** Concept art from different sources arrives at wildly
different exposures. `sharp.stats()` reads mean luminance and `.linear()`
normalises every plate to the same target, so a row of gallery images reads as
one set rather than a scrapbook.

**Attention cropping.** `sharp.strategy.attention` finds the busiest region, so
cropping a wide piece of key art down to a 5:3 timeline plate keeps the subject
instead of a corner of sky.

**Head detection.** Finds the horizontal centre of the figure's head and writes
it to the manifest as `headX` — which is what `Scene.tsx` then positions by.

> **Say this:** "The pipeline exists so the site never does image work at request
> time. Everything is decided once, at build."

---

## 5. Performance, concretely

| What | Why it's fast |
| --- | --- |
| All routes prerendered | No server render per request; a CDN serves HTML. |
| Images pre-sized at five widths | `srcset` picks one; nothing is resized per request. |
| Content-hashed + `immutable` | Repeat visits skip revalidation entirely. |
| WebP throughout | Roughly 30% smaller than JPEG at the same quality. |
| 12 Server Components | Those never reach the JS bundle at all. |
| `partialPrefetching: true` | Next prefetches the static shell of linked pages. |
| `cacheComponents: true` | Next 16's granular caching. |

**The catch to be honest about:** 54 MB of artwork is committed to the repo.
That's fine for a CDN and makes deployment trivial, but it makes `git clone`
slow. At a larger scale the images belong in object storage or Git LFS. Saying
this unprompted is better than being caught out by it.

---

## 6. Accessibility

Not an afterthought, and easy to demonstrate live:

- **Exactly one `<h1>` per page** — verified by an automated check.
- **Every section is `aria-labelledby` its own heading**, so a screen reader's
  landmark list reads as the page's table of contents.
- **The gallery lightbox** is `role="dialog"` + `aria-modal`, labelled
  `"Ezio gallery, plate 2 of 5"`, closes on Escape, moves on arrow keys.
- **Toggles use `aria-pressed`**, not colour alone.
- **Relationship lines carry line style as well as colour** (`encoding.tsx`), so
  the categories stay distinguishable without colour vision.
- **`prefers-reduced-motion: reduce`** disables the scene and figure animations.
- **Decorative art is `alt=""` and `aria-hidden`**; the character render carries
  the real name as `alt`.

### The lightbox bug, worth telling as a story

The gallery lightbox opened showing only half the image. The cause: the
`.archive` section has `isolation: isolate`, which creates a **new stacking
context** — and `z-index: 50` inside it cannot escape its parent. The header and
the next section painted over the modal.

The fix wasn't a bigger `z-index`. It was to portal the dialog out to `<body>`,
where it isn't trapped:

```tsx
createPortal(<div className="fixed inset-0 z-[100] ..."> ... </div>, document.body)
```

> This is a good story because the naive fix (`z-index: 9999`) *cannot* work, and
> explaining why shows you understand stacking contexts rather than guessing.

---

## 7. Testing

A Playwright suite of **28 behaviour checks**, run against a production build:

- Every route at desktop **and** mobile width: no console errors, no failed
  requests, no horizontal overflow, no broken images, exactly one `<h1>`
- Filters combining, sort orders, accent-insensitive search, the empty state
- Bookmarks surviving a reload
- The lightbox: portalled, covering the viewport, arrow keys, Escape
- The relationship map re-centring, the legend toggling
- An unknown slug returning a real 404
- The section rail clearing the content at 1440 / 1600 / 1800 / 1920 / 2560

There was also a one-off visual check: during a refactor that was supposed to
change nothing visible, **69 full-page screenshots before and after**. The
interesting part was isolating the noise — comparing a build *to itself* showed
one page differing by 10.45% from lazy-loading timing alone, so that number was
the floor, not a regression.

---

## 8. File map

```
app/
  layout.tsx            Root layout, header, metadata, metadataBase
  page.tsx              Home (7 lines — it's just <FeaturedHero/>)
  characters/page.tsx   Directory page shell
  characters/[slug]/
    page.tsx            Profile route: generateStaticParams, generateMetadata,
                        the Band helper, section assembly
  relationships/        Full-page map
  sitemap.ts robots.ts  Generated from the character list
  not-found.tsx         404
  globals.css           519 lines: tokens, base, texture, archive surfaces

components/
  scene/Scene.tsx                   Figure over setting, positioned by the head
  home/FeaturedHero.tsx             Homepage, era strip, scene transitions
  characters/Directory.tsx          Filters, sort, search, results grid
  characters/CharacterCard.tsx      One card
  profile/ProfileHero.tsx           Parchment dossier panel
  profile/Biography.tsx             Biography band
  profile/KeyMoments.tsx            Dated timeline rail
  profile/Gallery.tsx               Plates + portalled lightbox
  profile/Legacy.tsx                Closing panorama
  profile/SectionNav.tsx            Scroll-spy rail
  profile/Cartouche.tsx Compass.tsx Map fragment, compass rose
  relationships/RelationshipMap.tsx The map + measured SVG lines
  relationships/Explorer.tsx        Full-page wrapper, URL state
  relationships/ProfileMap.tsx      Profile-section wrapper
  relationships/encoding.tsx        Colour + line style per category
  search/SearchBox.tsx              Command-palette search
  audio/MusicPlayer.tsx             Header player
  bookmarks/                        Button + drawer
  layout/                           Header, footer, back button
  ui/                               Emblem, Portrait, SectionHeading

lib/
  art.ts          Manifest lookup, srcSet()
  relations.ts    The social graph: groupsFor, siblingsOf, parentsOf
  search.ts       Weighted search
  typeset.ts      Cinzel metrics, fitCaps()
  data.ts         Lookups, lifespan, chronoKey
  bookmarks.ts    localStorage via useSyncExternalStore
  history.ts      Navigation-API history mirror
  audio.ts        Reads public/audio/ at build time

data/
  types.ts  characters.ts  relationships.ts  catalog.ts

scripts/art/
  fetch.mjs  build.mjs  emblems.mjs

docs/
  architecture.md       This file
  design-reference.md   Why the design looks the way it does
  assets.md             Where every image came from
```

**Totals:** 6,336 lines of source across 51 files · 72 characters · 92
relationship edges · 926 generated images.

---

## 9. Questions you'll get, and the answers

**"Why Next.js and not plain React?"**
Server Components and build-time prerendering. The 844-line data file never
reaches the browser — only rendered HTML does. With plain React I'd either ship
all that data to the client or build an API to serve it.

**"How would you add a character?"**
Add a record to `data/characters.ts`, add their relationship edges, add their art
to the pipeline config, rebuild. No component changes. The sitemap, the
directory, the era counts and the relationship map all pick them up.

**"What was the hardest part?"**
The relationship map lines. Static coordinates break at every breakpoint, so they
had to be measured from the DOM — which meant `useLayoutEffect` so they don't
flash in the wrong place, and a `ResizeObserver` on each box, because a box can
reflow when text wraps or a web font loads without the container ever changing
size.

**"What would you do differently?"**
Three things. The 54 MB of committed artwork belongs in object storage. The data
would want a real CMS the moment anyone other than me edits it. And the
Playwright suite covers behaviour, not units — `lib/relations.ts` is pure
functions and deserves fast unit tests around the half-sibling logic.

**"Is this just a UI project?"**
The derived relationship graph, the font-metric heading system and the image
pipeline are all real logic. The UI is where it shows, not where it lives.

**"How do you know it works?"**
28 Playwright checks against a production build, across two viewports, plus
`tsc` and `eslint` clean.

---

## 10. A three-minute demo script

1. **Home** — "Every character has official art composed over their setting. The
   figure is positioned by its head, so it's never cropped through the face."
2. **Characters** — type `altair`. "Accent-insensitive — that's `altair` finding
   Altaïr." Filter to Age of Revolution + Templars. "Filters are AND across
   groups, OR within one."
3. **A profile** — "Sections are built from available data. This one has a full
   dossier; that one doesn't, and it still renders." Resize the window. "The
   heading stays on one line at any width — it's sized from measured font
   metrics, not a guess."
4. **Relationships** — "These lines are measured from the DOM, not a graph
   library." Resize. "They stay attached." Click a node. "Siblings and
   grandchildren are derived from 92 stored edges."
5. **DevTools, Network** — "Images are content-hashed and cached immutable for a
   year. Nothing is resized at request time."

End on the honest limitation — the committed artwork. It leaves them with the
impression that you know where the project's edges are.
