"use client";

import { ArrowRight } from "lucide-react";
import { useId, useState } from "react";
import { Scene } from "@/components/scene/Scene";
import { Emblem } from "@/components/ui/Emblem";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Character } from "@/data/types";
import { displayName } from "@/lib/data";
import { srcSet, type Art } from "@/lib/art";

/**
 * A dossier laid into the archive: the account at the left, the character in
 * their world across the middle, and the line they are remembered by at the
 * right, over an engraving of their own city.
 *
 * The opening paragraphs carry the section; the rest unfolds in place, so the
 * composition stays the wide band the reference sets and no text is lost.
 */
export function Biography({ character: c, art }: { character: Character; art: Art }) {
  const [open, setOpen] = useState(false);
  const restId = useId();

  const d = c.dossier;
  const paragraphs = d ? d.biography : [c.role, c.note].filter((p): p is string => !!p);
  const lead = paragraphs.slice(0, 2);
  const rest = paragraphs.slice(2);
  // An editorial line, never dressed up as dialogue — the character's own quotes
  // belong to the hero and the Legacy close. Without a dossier the only such line
  // is `role`, which is already the opening paragraph, so the slot stays empty
  // rather than printing the same sentence twice.
  const pull = d?.tagline;

  return (
    <section id="biography" aria-labelledby="biography-title" className="archive grain relative border-y border-line">
      {/* The character's own city, read as an engraving, anchored under the right column. */}
      {art.scene && (
        <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 z-0 hidden h-[58%] w-[32%] lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized WebP, as elsewhere */}
          <img
            src={art.scene.src}
            alt=""
            aria-hidden
            className="etched size-full object-cover opacity-[0.055]"
            style={{ objectPosition: "60% 70%", maskImage: "radial-gradient(90% 110% at 85% 100%, #000 15%, transparent 78%)" }}
          />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.25fr)_minmax(0,0.83fr)] lg:items-center lg:gap-8">
          {/* ── The account ── */}
          <div className="lg:self-center">
            <SectionHeading id="biography-title" title={d ? "Biography" : "Summary"} kicker={c.setting} />
            <div className="max-w-[46ch] space-y-4 text-[1.02rem] leading-[1.72] text-bone-dim">
              {lead.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {rest.length > 0 && (
                <div id={restId} hidden={!open} className="space-y-4">
                  {rest.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
              {!d && (
                <p className="font-sans text-sm leading-relaxed text-muted">
                  A full dossier for {displayName(c)} has not been written yet. The facts above, the key moments and the
                  relationships below are checked against the sources at the foot of this page.
                </p>
              )}
            </div>
            {rest.length > 0 && (
              <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={restId} className="btn-outline mt-8">
                {open ? "Show less" : "Read full biography"}
                <ArrowRight className={`size-4 ${open ? "-rotate-90" : ""}`} />
              </button>
            )}
          </div>

          {/* ── The band: official art of this life, not the hero's view of it ── */}
          <figure className="relative aspect-[16/9] overflow-hidden lg:aspect-[16/11]">
            {art.bio ? (
              /* eslint-disable-next-line @next/next/no-img-element -- static pre-sized WebP, as elsewhere */
              <img
                src={art.bio.src}
                srcSet={srcSet(art.bio)}
                sizes="(min-width: 1024px) 42vw, 100vw"
                alt=""
                loading="lazy"
                decoding="async"
                className="feather-edges absolute inset-0 size-full object-cover"
                style={{ objectPosition: "50% 38%" }}
              />
            ) : (
              /* No art of their own life yet: the character in their setting instead. */
              <div className="feather-edges absolute inset-0">
                <Scene
                  character={c}
                  art={art}
                  scenePosition={c.framing?.hero ?? "50% 45%"}
                  sceneSizes="(min-width: 1024px) 42vw, 100vw"
                  figureSizes="(min-width: 1024px) 16vw, 40vw"
                  figureClass="left-[30%] top-[8%] h-[96%]"
                />
              </div>
            )}
            {/* Warm light pooled low, so the band sits in the page rather than on it. */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-ink-950/45" />
          </figure>

          {/* ── The line they are remembered by ── */}
          <figure className="relative lg:self-center lg:pl-2">
            <span aria-hidden className="seam mb-7 block w-24 lg:hidden" />
            {pull && (
              <>
                <p className="text-[clamp(1.25rem,1.75vw,1.65rem)] italic leading-[1.35] text-bone">{pull}</p>
                <figcaption className="mt-5 flex items-center gap-4">
                  <span aria-hidden className="h-px w-8 shrink-0 bg-crimson-bright" />
                  <span className="label text-[0.62rem] text-bone-dim">{displayName(c)}</span>
                </figcaption>
              </>
            )}
            {d?.themes && (
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2" aria-label="Themes">
                {d.themes.map((t) => (
                  <li key={t} className="label text-[0.58rem] text-muted">
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {c.aliases?.length ? (
              <p className="mt-5 text-[0.92rem] italic leading-relaxed text-muted">Also known as {c.aliases.join("; ")}</p>
            ) : null}
            <Emblem
              kind={d?.emblem ?? c.faction}
              className="pointer-events-none absolute -bottom-6 right-0 -z-10 size-28 text-bone opacity-[0.05] lg:-right-6 lg:size-40"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
