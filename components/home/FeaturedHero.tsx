"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Scene } from "@/components/scene/Scene";
import { Portrait } from "@/components/ui/Portrait";
import type { Character } from "@/data/types";
import { NO_ART, type ArtMap } from "@/lib/art";
import { displayName, eraName, featuredCharacters, lifespan } from "@/lib/data";

const DEFAULT_ID = "ezio";

/** Labels down the right edge: the setting first, then the character's themes. */
function markers(c: Character) {
  const rest = (c.themes ?? c.dossier?.themes)?.slice(0, 3) ?? [eraName(c), c.affiliations[0]];
  return [c.setting, ...rest].filter((m): m is string => !!m).slice(0, 4);
}

interface Layer {
  id: string;
  key: number;
}

/**
 * The homepage: one screen, no scrolling. The selected character's world fills
 * it, and choosing another cross-fades the setting, steps the new figure in and
 * shifts the theme colours (accent, sky glow, ground tint) to theirs.
 */
export function FeaturedHero({ art }: { art: ArtMap }) {
  const [index, setIndex] = useState(() => Math.max(0, featuredCharacters.findIndex((f) => f.id === DEFAULT_ID)));
  const c = featuredCharacters[index];
  const p = c.palette!;
  const quote = c.quote;
  const [layers, setLayers] = useState<Layer[]>(() => [{ id: c.id, key: 0 }]);
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Start with the selected card in view (Ezio sits mid-strip in historical order).
  useEffect(() => {
    const strip = stripRef.current;
    const card = cardRefs.current[index];
    if (!strip || !card) return;
    strip.scrollLeft = card.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2;
    // Only on first render; later selections scroll themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop the outgoing layer once its fade has finished.
  useEffect(() => {
    if (layers.length < 2) return;
    const t = setTimeout(() => setLayers((l) => l.slice(-1)), 900);
    return () => clearTimeout(t);
  }, [layers]);

  const select = (i: number, focus = false) => {
    const next = (i + featuredCharacters.length) % featuredCharacters.length;
    if (next === index) return;
    setIndex(next);
    setLayers((l) => [...l.slice(-1), { id: featuredCharacters[next].id, key: Date.now() }]);
    const card = cardRefs.current[next];
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    if (focus) card?.focus();
  };

  /**
   * Desktop composition as CSS variables (used by the lg: classes on the scene and figure).
   * A character can start its setting partway across the screen (`sceneLeft`), so a
   * landmark at the image's left edge, like Edward's flag, sits beside the headline
   * instead of under its shade.
   */
  const homeVars = (ch: Character) => {
    const h = ch.framing?.home ?? {};
    return {
      "--scene-left": h.sceneLeft ?? "0%",
      "--scene-top": h.sceneTop ?? "7%",
      "--scene-fade": h.sceneLeft ? "12%" : "0%",
      "--fig-left": h.figureLeft ?? "50%",
      "--fig-top": h.figureTop ?? "7%",
      "--fig-h": h.figureHeight ?? "134%",
    } as React.CSSProperties;
  };

  // Behind the headline: when the setting starts partway across, the left is plain dark up to it.
  const sceneLeft = c.framing?.home?.sceneLeft;
  const headlineShade = sceneLeft
    ? `linear-gradient(90deg, var(--ink-950) 0%, rgb(11 10 9 / 0.85) calc(${sceneLeft} - 4%), transparent calc(${sceneLeft} + 4%))`
    : "linear-gradient(90deg, var(--ink-950) 0%, rgb(11 10 9 / 0.75) 18%, rgb(11 10 9 / 0.15) 36%, transparent 46%)";

  const scroll = (d: number) => stripRef.current?.scrollBy({ left: d * stripRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section
      aria-label="Featured characters"
      className="theme-shift relative isolate flex h-[100svh] min-h-[620px] flex-col overflow-hidden bg-ink-950"
      style={{ "--accent": p.accent, "--sky": p.sky, "--ground": p.ground } as React.CSSProperties}
    >
      {/* ── The world ── */}
      <div aria-hidden className="absolute inset-0 -z-20">
        {layers.map((layer, i) => {
          const ch = featuredCharacters.find((f) => f.id === layer.id)!;
          const outgoing = i < layers.length - 1;
          return (
            <div key={layer.key} className={`absolute inset-0 ${outgoing ? "layer-out" : ""}`} style={homeVars(ch)}>
              <Scene
                character={ch}
                art={art[ch.id] ?? NO_ART}
                animate={layer.key !== 0}
                priority={layer.key === 0}
                scenePosition={ch.framing?.home?.scenePosition ?? ch.framing?.hero ?? "50% 45%"}
                sceneFit={ch.framing?.home?.sceneFit}
                sceneClass="lg:left-[var(--scene-left)] lg:[mask-image:linear-gradient(90deg,transparent,#000_var(--scene-fade))]"
                figureClass="left-[62%] top-[16%] h-[92%] sm:left-[58%] lg:left-[var(--fig-left)] lg:top-[var(--fig-top)] lg:h-[var(--fig-h)]"
                figureSizes="(min-width: 1024px) 38vw, 95vw"
              />
            </div>
          );
        })}
      </div>

      {/* ── Edges only: no colour grade over the art, just enough shade for the text to read ── */}
      {/* A light fade behind the nav. */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[14%] bg-gradient-to-b from-ink-950/45 to-transparent" />
      {/* Behind the headline. */}
      <div aria-hidden className="absolute inset-y-0 left-0 -z-10 hidden w-full lg:block" style={{ background: headlineShade }} />
      {/* On a phone the copy runs nearly edge to edge, so this carries much further
          across than the desktop shade — the intro used to sit on Ezio's white robe. */}
      <div aria-hidden className="absolute inset-y-0 left-0 -z-10 w-full bg-[linear-gradient(90deg,var(--ink-950)_0%,rgb(11_10_9/0.88)_34%,rgb(11_10_9/0.62)_62%,rgb(11_10_9/0.22)_86%,transparent_100%)] lg:hidden" />
      <div aria-hidden className="absolute inset-y-0 right-0 -z-10 w-full bg-[linear-gradient(270deg,rgb(11_10_9/0.86)_0%,rgb(11_10_9/0.6)_10%,rgb(11_10_9/0.22)_24%,transparent_36%)]" />
      {/* A soft pool behind the quote and markers, so they read over pale scenes
          like Baghdad without squaring off into a panel. */}
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-[radial-gradient(26%_46%_at_88%_44%,rgb(11_10_9/0.62),transparent_72%)] lg:block" />
      {/* Behind the featured strip; tinted by the character's ground colour. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[32%] bg-[linear-gradient(0deg,var(--ink-950)_0%,color-mix(in_srgb,var(--ground)_70%,transparent)_45%,transparent_100%)]" />
      {/* A figure cropped mid-body (e.g. at the knees) stands behind a solid floor under the strip header. */}
      {c.framing?.home?.sceneFit === "width" && (
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 hidden h-[30%] bg-[linear-gradient(0deg,var(--ink-950)_0%,var(--ink-950)_50%,transparent_100%)] lg:block" />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-950/45 lg:hidden" />

      {/* ── Headline · quote ── */}
      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 items-center gap-8 px-5 pt-[calc(var(--header-h)+1rem)] sm:px-8 lg:grid-cols-[minmax(0,27rem)_1fr_minmax(0,16.5rem)] xl:px-20">
        <div>
          <p className="label flex items-center gap-3 tracking-[0.32em] text-bone-dim">
            Explore <span className="text-[color:var(--accent)]">·</span> Discover <span className="text-[color:var(--accent)]">·</span> Connect
          </p>
          <h1 className="display mt-[clamp(0.75rem,2svh,1.4rem)] text-[clamp(2.4rem,min(4.6vw,7.6svh),4.5rem)] leading-[1.05] tracking-[0.07em]">
            People
            <br />
            Shape
            <br />
            <span className="text-crimson-bright">History</span>
          </h1>
          <p className="mt-[clamp(0.75rem,2.4svh,1.5rem)] max-w-[25rem] text-[clamp(0.98rem,2svh,1.1rem)] leading-relaxed text-bone-dim">
            From hidden blades to lost legacies, explore the lives, bonds and rivalries of the Assassins and Templars
            across time.
          </p>
          <Link href="/characters" className="btn-outline mt-[clamp(1rem,3svh,2rem)] bg-ink-950/30 shadow-[0_0_26px_-8px_rgb(214_34_43/0.75)]">
            Explore characters <ArrowRight className="size-4" />
          </Link>
        </div>

        <span aria-hidden className="hidden lg:block" />

        <div key={c.id} className="rise-in hidden self-center [text-shadow:0_1px_2px_rgb(0_0_0/0.95),0_0_10px_rgb(0_0_0/0.85),0_0_26px_rgb(0_0_0/0.7)] lg:block" aria-live="polite">
          {quote ? (
            <figure>
              <blockquote className="whitespace-pre-line text-[1.1rem] italic leading-snug text-bone">“{quote.text}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="h-px w-6 bg-[var(--accent)]" />
                <span className="label text-[0.66rem] text-bone/85">{displayName(c)}</span>
              </figcaption>
            </figure>
          ) : (
            // Editorial line, not dialogue: no quotation marks; the name is a caption, not an attribution.
            <div>
              <p className="text-[1.2rem] italic leading-snug text-bone">{c.dossier?.tagline ?? c.role}</p>
              <p className="label mt-4 flex items-center gap-3 text-[0.66rem] text-bone/85">
                <span className="h-px w-6 bg-[var(--accent)]" />
                {displayName(c)}
              </p>
            </div>
          )}

          <ol className="relative mt-12 space-y-4 pl-6" aria-label={`${displayName(c)}: setting and themes`}>
            <span aria-hidden className="absolute bottom-2 left-[4px] top-2 w-px bg-[color:var(--accent)] opacity-40" />
            {markers(c).map((m, i, all) => (
              <li key={m} className="label relative text-[0.66rem] text-bone">
                <span
                  aria-hidden
                  className={`absolute top-1/2 -translate-y-1/2 rounded-full ${
                    i === 0
                      ? "-left-6 size-[9px] border-2 border-crimson-bright bg-ink-950 shadow-[0_0_8px_rgb(214_34_43/0.8)]"
                      : i === all.length - 1
                        ? "-left-6 size-[9px] border border-bone-dim bg-ink-950"
                        : "left-[-22px] size-[5px] bg-bone"
                  }`}
                />
                <span className={i === 0 ? "text-bone" : ""}>{m}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── Featured strip ── */}
      <div className="relative w-full shrink-0 pb-[clamp(1rem,3.5svh,2.5rem)] pt-3">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 xl:px-20">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-4 w-[2px] bg-crimson" />
            <h2 className="label whitespace-nowrap text-[0.7rem] tracking-[0.2em] text-bone sm:text-[0.8rem] sm:tracking-[0.3em]">Featured characters</h2>
            <span aria-hidden className="hidden h-px flex-1 bg-line-strong sm:block" />
            <Link href="/characters" className="group label ml-auto flex shrink-0 items-center gap-2 text-[0.66rem] text-bone hover:text-[color:var(--accent)] sm:ml-0">
              <span className="sm:hidden">View all</span>
              <span className="hidden sm:inline">View all characters</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div
            ref={stripRef}
            role="radiogroup"
            aria-label="Choose a featured character"
            className="scroll-strip -mx-1 flex gap-3 overflow-x-auto px-1 py-2"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                select(index + 1, true);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                select(index - 1, true);
              }
            }}
          >
            {/* Compact cards, ten across on desktop, so the character and their world stay the focus. */}
            {featuredCharacters.map((f, i) => {
              const selected = i === index;
              const cardArt = art[f.id]?.card;
              return (
                <button
                  key={f.id}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(i)}
                  className={`group relative aspect-[3/2] w-[34%] shrink-0 overflow-hidden border transition-[border-color,box-shadow] duration-300 sm:w-[21%] md:w-[15%] xl:w-[calc((100%-6.75rem)/10)] ${
                    selected ? "border-crimson-bright shadow-[0_0_20px_-4px_rgb(214_34_43/0.75)]" : "border-line-strong hover:border-bone-dim/60"
                  }`}
                >
                  {/* Cards load at low priority: the hero figure behind them gets the bandwidth first. */}
                  {cardArt ? (
                    <Image
                      src={cardArt}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 14vw, 45vw"
                      fetchPriority="low"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <Portrait character={f} src={art[f.id]?.portrait} sizes="300px" className="absolute inset-0" monogramSize="text-2xl" />
                  )}
                  {/* Dark lower band so the name never sits on the figure. */}
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(0deg,var(--ink-950)_0%,rgb(11_10_9/0.92)_38%,rgb(11_10_9/0.5)_70%,transparent)]" />
                  {selected && <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-crimson/30 via-crimson/5 to-transparent" />}
                  <span className="absolute inset-x-1.5 bottom-[8%] flex flex-col items-center text-center">
                    <span className="block w-full truncate font-display text-[0.62rem] uppercase tracking-[0.08em] text-bone">{displayName(f)}</span>
                    <span className="block font-display text-[0.55rem] tracking-[0.08em] text-bone-dim">{lifespan(f)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Arrows sit centred on the cards: bottom padding + half a 3:2 card at ten across. */}
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll featured characters left"
          className="absolute bottom-[calc(clamp(1rem,3.5svh,2.5rem)+0.5rem+(min(100vw,1600px)-16.75rem)/30)] left-4 z-10 hidden size-9 translate-y-1/2 place-items-center rounded-full border border-crimson/70 bg-ink-950/75 text-bone transition-colors hover:border-crimson-bright xl:grid"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll featured characters right"
          className="absolute bottom-[calc(clamp(1rem,3.5svh,2.5rem)+0.5rem+(min(100vw,1600px)-16.75rem)/30)] right-4 z-10 hidden size-9 translate-y-1/2 place-items-center rounded-full border border-crimson/70 bg-ink-950/75 text-bone transition-colors hover:border-crimson-bright xl:grid"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </section>
  );
}
