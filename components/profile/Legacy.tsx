/* eslint-disable @next/next/no-img-element --
   The closing panorama is the same static pre-sized WebP the hero uses; srcset picks it. */
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Emblem } from "@/components/ui/Emblem";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Character } from "@/data/types";
import { srcSet, type Art } from "@/lib/art";

/**
 * The closing scene: the character's world across the full width, dimmed and
 * worn at its edges, with what they left behind at the left and their parting
 * line at the right.
 */
export function Legacy({ character: c, art }: { character: Character; art: Art }) {
  const d = c.dossier;
  // Every profile gets a closing scene. A dossier closes on its own parting line;
  // everyone else closes on their own quote, the way the reference repeats a
  // character's signature at the end.
  const closing = d?.closingQuote ?? c.quote;

  return (
    <section id="legacy" aria-labelledby="legacy-title" className="archive grain relative isolate overflow-hidden border-t border-line">
      {art.scene ? (
        <>
          <img
            src={art.scene.src}
            srcSet={srcSet(art.scene)}
            sizes="100vw"
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="feather-y absolute inset-0 -z-10 size-full object-cover opacity-[0.42]"
            style={{ objectPosition: "50% 62%" }}
          />
          {/* Warm art at the right, the page's dark at the left, so the text has ground. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950 via-ink-950/82 to-ink-950/25" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/70" />
          {/* Ground under the parting line, so it never fights the brightest part of the art. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{ background: "radial-gradient(55% 60% at 78% 50%, rgb(11 10 9 / 0.78), transparent 72%)" }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ background: `radial-gradient(80% 120% at 75% 100%, ${c.palette?.sky}, transparent 70%)` }}
        />
      )}

      {/* The archive's mark, sunk into the artwork at the right. */}
      <Emblem
        kind={d?.emblem ?? c.faction}
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-0 -z-10 size-[22rem] text-bone opacity-[0.07] lg:size-[30rem]"
      />

      <div className="mx-auto grid max-w-[1320px] items-end gap-12 px-4 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
        <div>
          <SectionHeading id="legacy-title" title="Legacy" />
          <p className="max-w-[56ch] text-[1.1rem] leading-[1.75] text-bone-dim">{d?.legacy ?? c.role}</p>
          <Link href="/characters" className="btn-outline mt-10">
            <ArrowLeft className="size-4" /> Back to the archive
          </Link>
        </div>

        {closing && (
          <figure className="lg:pl-10 lg:text-right">
            <blockquote className="whitespace-pre-line text-[clamp(1.4rem,2.2vw,1.95rem)] italic leading-snug text-bone">
              “{closing.text}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-4 lg:justify-end">
              <span aria-hidden className="h-px w-8 shrink-0 bg-crimson-bright lg:order-last" />
              <span className="label text-[0.62rem] text-bone-dim">{closing.context}</span>
            </figcaption>
          </figure>
        )}
      </div>

      {/* Archive branding, as the reference closes the page. */}
      <div className="relative mx-auto max-w-[1320px] px-4 pb-10 sm:px-8">
        <span aria-hidden className="seam mb-5 block" />
        <p className="label text-right text-[0.58rem] text-muted">The Animus Archive · People · Choices · History</p>
      </div>
    </section>
  );
}
