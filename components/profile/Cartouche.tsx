import { Compass } from "./Compass";

/**
 * The archival corner of the dossier: a map fragment with the character's place
 * pinned on it, a compass rose, and their signature line beneath.
 *
 * The linework is deliberately generic — a graticule and contour curves, not a
 * traced coastline — so it reads as cartography without claiming to be a real
 * map of anywhere.
 */
export function Cartouche({
  place,
  coords,
  signature,
  attribution,
  className = "",
}: {
  place: string;
  coords?: string;
  signature?: string;
  attribution?: string;
  className?: string;
}) {
  return (
    <figure className={`text-parchment-muted ${className}`}>
      <div className="relative border border-parchment-ink/20 bg-parchment-deep/25 p-1.5 shadow-sm shadow-parchment-ink/10">
        <svg viewBox="0 0 150 104" aria-hidden className="w-full" fill="none" stroke="currentColor">
          <g strokeWidth=".35" opacity=".4">
            {[16, 36, 56, 76, 96].map((y) => (
              <line key={y} x1="4" y1={y} x2="146" y2={y} />
            ))}
            {[22, 48, 74, 100, 126].map((x) => (
              <line key={x} x1={x} y1="4" x2={x} y2="100" />
            ))}
          </g>
          <g strokeWidth=".75" opacity=".6">
            <path d="M18 76c14-6 20-22 34-26s22 6 34-2 18-20 30-18" />
            <path d="M24 88c16-8 24-26 40-30s26 8 38 0 20-22 32-20" strokeOpacity=".5" />
            <path d="M10 42c10 4 16 0 22-6s14-10 22-6" strokeOpacity=".45" />
          </g>
          <rect x="4" y="4" width="142" height="96" strokeWidth=".6" opacity=".5" />
        </svg>

        {/* The pin sits high-left, clear of the compass in the opposite corner. A fallback
            place can be "Town, Region" — only the settlement is pinned, and it never wraps. */}
        <span className="absolute left-[9%] right-[9%] top-[19%] flex items-center gap-1.5">
          <span aria-hidden className="size-[6px] shrink-0 rotate-45 bg-crimson shadow-[0_0_5px_rgb(184_20_29/0.8)]" />
          <span className="label truncate text-[0.48rem] tracking-[0.16em] text-parchment-ink">{place.split(",")[0].trim()}</span>
        </span>

        <Compass className="absolute bottom-0.5 right-0.5 w-[40%] opacity-80" />
      </div>

      {coords && <p className="mt-1.5 text-right font-sans text-[0.55rem] tracking-[0.1em]">{coords}</p>}
      {signature && (
        <figcaption className="mt-3 text-right">
          <span className="block text-[1.05rem] italic leading-tight text-parchment-ink/85">{signature}</span>
          {attribution && <span className="label mt-1.5 block text-[0.48rem] tracking-[0.16em]">— {attribution}</span>}
        </figcaption>
      )}
    </figure>
  );
}
