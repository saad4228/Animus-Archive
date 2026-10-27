"use client";

/* eslint-disable @next/next/no-img-element --
   Plates are the same static pre-sized WebP the rest of the profile serves; next/image
   would add a resize at request time for no gain. */
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { srcSet, type ResponsiveImage } from "@/lib/art";

/**
 * A row of recovered plates: wide, close together, worn at the edges. Opening one
 * shows it whole, with arrow keys and Escape.
 */
export function Gallery({ plates, name }: { plates: ResponsiveImage[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  // The whole row fits on a wide screen, where arrows would only crowd the plates.
  const [scrolls, setScrolls] = useState(false);
  const stripRef = useRef<HTMLUListElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const label = (i: number) => `${name}: plate ${i + 1}`;

  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + plates.length) % plates.length)),
    [plates.length],
  );

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth + 4);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  const scroll = (d: number) => stripRef.current?.scrollBy({ left: d * stripRef.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = "absolute top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-ink-950/85 text-bone-dim transition-colors hover:border-crimson hover:text-bone lg:grid";

  return (
    <div className="relative">
      <ul ref={stripRef} className="scroll-strip flex gap-3 overflow-x-auto lg:gap-4">
        {plates.map((plate, i) => (
          <li key={plate.src} className="w-[72%] shrink-0 sm:w-[44%] lg:w-[calc((100%-4rem)/5)]">
            <button
              onClick={() => setOpen(i)}
              aria-label={`Open ${label(i)}`}
              className="plate group relative block aspect-[16/10] w-full overflow-hidden bg-ink-900 transition-colors hover:border-crimson/55"
            >
              <img
                src={plate.src}
                srcSet={srcSet(plate)}
                sizes="(min-width: 1024px) 19vw, 72vw"
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                style={{ objectPosition: "50% 42%", filter: "saturate(0.88) brightness(0.86)" }}
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
              <span
                aria-hidden
                className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full border border-bone/35 bg-ink-950/70 text-bone-dim transition-colors group-hover:border-crimson-bright group-hover:text-bone"
              >
                <Plus className="size-3.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {scrolls && (
        <>
          <button onClick={() => scroll(-1)} aria-label="Scroll gallery left" className={`${arrow} -left-5`}>
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll gallery right" className={`${arrow} -right-5`}>
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {/* Portalled to <body>: the gallery sits inside `.archive`, which isolates its
          stacking context, so an overlay left in place is painted over by the header
          above it and by the Legacy section below. */}
      {open !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} gallery, plate ${open + 1} of ${plates.length}`}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest("button, img")) setOpen(null);
            }}
            className="fade-in fixed inset-0 z-[100] bg-ink-950/95 backdrop-blur-md"
          >
            <div className="absolute inset-6 sm:inset-14">
              <img src={plates[open].src} srcSet={srcSet(plates[open])} sizes="100vw" alt={label(open)} className="size-full object-contain" />
            </div>
            <button
              ref={closeRef}
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-11 place-items-center text-bone"
            >
              <X className="size-6" />
            </button>
            {plates.length > 1 && (
              <>
                <button onClick={() => step(-1)} aria-label="Previous plate" className="lightbox-step left-3">
                  <ChevronLeft className="size-5" />
                </button>
                <button onClick={() => step(1)} aria-label="Next plate" className="lightbox-step right-3">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
            <p className="label absolute bottom-4 left-1/2 -translate-x-1/2 text-muted">
              {label(open)} · {open + 1} / {plates.length}
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}
