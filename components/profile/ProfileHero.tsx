import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { BackButton } from "@/components/layout/BackButton";
import { Scene } from "@/components/scene/Scene";
import { Emblem } from "@/components/ui/Emblem";
import { gameById } from "@/data/catalog";
import type { Character } from "@/data/types";
import type { Art } from "@/lib/art";
import { displayName, eraName, lifespan } from "@/lib/data";
import { fitCaps } from "@/lib/typeset";
import { Cartouche } from "./Cartouche";

/** "Ezio Auditore da Firenze" with epithet "da Firenze" → "Ezio Auditore". */
function headingName(c: Character) {
  const epithet = c.dossier?.epithet;
  if (epithet && c.name.endsWith(` ${epithet}`)) return c.name.slice(0, -epithet.length - 1);
  return c.name;
}

/** Rows naming an allegiance carry its mark, as the reference's "Brotherhood" row does. */
const ALLEGIANCE = /brotherhood|affiliation|order|allegiance/i;

function infoRows(c: Character) {
  if (c.dossier) return c.dossier.info;
  return [
    c.born && { label: "Born", value: [lifespan(c)?.replace(/^b\. /, ""), c.birthplace].filter(Boolean).join(", ") },
    c.era && { label: "Era", value: eraName(c)! },
    c.affiliations[0] && { label: "Affiliation", value: c.affiliations.join("; ") },
  ].filter(Boolean) as { label: string; value: string }[];
}

/**
 * Art on the left two-thirds, a parchment dossier on the right whose torn edge
 * dissolves into the scene. On narrow screens the parchment follows the art.
 */
export function ProfileHero({ character: c, art }: { character: Character; art: Art }) {
  const name = headingName(c);
  const emblem = c.dossier?.emblem ?? c.faction;
  // Every character has a birthplace to pin, even where exact coordinates are not recorded.
  const locus = c.dossier?.locus ?? (c.birthplace ? { name: c.birthplace, coords: undefined } : null);

  return (
    /* The parchment sits in the right grid column, so a long dossier makes the hero taller
       instead of being clipped by a fixed height. The art stays absolute behind it. */
    <section
      id="overview"
      aria-label={`${c.name}: overview`}
      className="relative bg-ink-950 lg:grid lg:min-h-[clamp(760px,100svh,980px)] lg:grid-cols-[1fr_minmax(31rem,46%)] xl:grid-cols-[1fr_minmax(31rem,42%)]"
    >
      {/* ── Art ── */}
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/10] lg:absolute lg:inset-y-0 lg:left-0 lg:aspect-auto lg:w-[68%]">
        <Scene
          character={c}
          art={art}
          priority
          scenePosition={c.framing?.hero ?? "50% 45%"}
          sceneSizes="(min-width: 1024px) 68vw, 100vw"
          figureSizes="(min-width: 1024px) 38vw, 95vw"
          figureClass="left-[55%] top-[9%] h-[118%] lg:left-[48%] lg:top-[10%] lg:h-[124%]"
        />
        {/* No colour grade over the art; only fades into the header, margin, parchment and page. */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink-950/80 via-ink-950/30 to-transparent" />
        <div aria-hidden className="absolute inset-y-0 left-0 hidden w-72 bg-gradient-to-r from-ink-950/80 via-ink-950/25 to-transparent xl:block" />
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-32 bg-gradient-to-l from-ink-950/40 to-transparent lg:block" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
      </div>

      <BackButton fallback="/characters" fallbackLabel="characters" className="absolute left-4 top-[calc(var(--header-h)+1rem)] z-20 sm:left-8" />

      {/* ── Margin: epigraph, emblem, themes ── */}
      <div className="absolute left-8 top-[calc(var(--header-h)+6rem)] z-10 hidden w-36 xl:block">
        {c.dossier?.epigraph && (
          <>
            <p className="label leading-[1.9] text-bone-dim">{c.dossier.epigraph.text}</p>
            <span aria-hidden className="my-6 block h-px w-10 bg-bone-dim/50" />
          </>
        )}
        <Emblem kind={emblem} className="size-12" />
        {c.dossier?.themes && (
          <ul className="mt-6 space-y-1.5" aria-label="Themes">
            {c.dossier.themes.map((t) => (
              <li key={t} className="label text-bone">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Parchment dossier ── */}
      <div
        className="parchment grain relative z-10 px-6 pb-14 pt-10 sm:px-10 lg:torn-left lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:justify-center lg:pb-12 lg:pl-16 lg:pr-12 lg:pt-[calc(var(--header-h)+1.5rem)] xl:pl-20"
        style={{ boxShadow: "inset 0 0 120px rgb(80 55 25 / 0.22)" }}
      >
        {/* Vignette: the sheet darkens towards its own edges, as aged paper does. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(130% 95% at 50% 45%, transparent 38%, rgb(74 52 24 / 0.1) 68%, rgb(58 40 18 / 0.26) 100%)",
          }}
        />

        {/* The container is the text column itself, so the name can be sized against it. */}
        <div className="@container relative">
          <p className="label text-[0.66rem] text-parchment-muted">
            {c.games.map((g, i) => (i === 0 ? gameById[g].title : gameById[g].short)).join("  |  ")}
          </p>
          <span aria-hidden className="mt-5 block h-[3px] w-10 bg-crimson" />

          <h1 className="display mt-5 text-parchment-ink" style={{ fontSize: fitCaps(name) }}>
            {name}
          </h1>

          <p className="mt-4 flex items-center gap-4 whitespace-nowrap font-display text-[clamp(0.9rem,1.35vw,1.3rem)] uppercase tracking-[0.24em] text-crimson">
            {c.dossier?.epithet ?? c.setting}
            <span aria-hidden className="h-px flex-1 bg-crimson/55" />
          </p>

          {c.quote ? (
            <figure className="mt-6 lg:pr-4">
              <blockquote className="whitespace-pre-line text-[clamp(1.15rem,1.5vw,1.35rem)] italic leading-snug text-parchment-ink/90">
                “{c.quote.text}”
              </blockquote>
              <figcaption className="mt-3 flex items-start gap-3">
                <span aria-hidden className="mt-[0.45rem] h-px w-7 shrink-0 bg-crimson" />
                <span className="label text-[0.6rem] text-parchment-muted">{c.quote.context}</span>
              </figcaption>
            </figure>
          ) : (
            // No recorded line: an editorial summary, never dressed up as dialogue.
            <p className="mt-6 text-[clamp(1.15rem,1.5vw,1.35rem)] italic leading-snug text-parchment-ink/90 lg:pr-4">
              {c.dossier?.tagline ?? c.role}
            </p>
          )}

          {/* Info rows at the left, the archival corner at the right, as the reference sets them. */}
          <div className="mt-7 border-t border-parchment-ink/20 pt-5 lg:flex lg:items-start lg:gap-6">
            <dl className="grid min-w-0 flex-1 grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-2.5">
              {infoRows(c).map((row) => (
                <div key={row.label} className="contents">
                  <dt className="label pt-[4px] text-[0.6rem] text-parchment-muted">{row.label}</dt>
                  <dd className="flex items-baseline gap-2 text-[1rem] leading-snug text-parchment-ink">
                    {ALLEGIANCE.test(row.label) && (
                      <Emblem kind={c.faction} className="size-[0.85em] shrink-0 translate-y-[0.1em] text-crimson" />
                    )}
                    {/* Only a value with no break point of its own, like "Kanien'kehá:ka", breaks. */}
                    <span className="min-w-0 break-words">{row.value}</span>
                  </dd>
                </div>
              ))}
            </dl>

            {locus && (
              <Cartouche
                place={locus.name}
                coords={locus.coords}
                signature={c.dossier?.signature}
                attribution={c.dossier?.signature ? displayName(c) : undefined}
                className="mt-8 hidden w-44 shrink-0 sm:block lg:mt-0 lg:w-[9.5rem] xl:w-[10.5rem]"
              />
            )}
          </div>

          <div className="mt-7">
            <BookmarkButton
              id={c.id}
              name={displayName(c)}
              variant="labelled"
              className="text-parchment-ink! hover:text-crimson! aria-pressed:text-crimson!"
            />
          </div>
          {c.note && <p className="mt-6 max-w-[30rem] font-sans text-xs leading-relaxed text-parchment-muted">{c.note}</p>}
        </div>
      </div>
    </section>
  );
}
