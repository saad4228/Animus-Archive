import type { Dossier, Faction } from "@/data/types";
import { emblemPaths } from "./emblem-paths";

type EmblemKind = Faction | Dossier["emblem"] | "seal";

/**
 * The site mark and the two faction marks are solid shapes traced from the supplied artwork;
 * the rest are original line drawings:
 * - seal: the site mark, shown in the header and footer
 * - brotherhood: the Assassin insignia, for Assassins and Hidden Ones
 * - templar: the Templar cross
 * - independent: a compass star, for those who are neither
 * - lily / jolly-roger: per-character emblems
 */

/** The traced marks, defined once per document and referenced by every Emblem. */
export function EmblemDefs() {
  return (
    <svg aria-hidden className="pointer-events-none absolute size-0" focusable="false">
      <defs>
        {Object.entries(emblemPaths).map(([kind, d]) => (
          <symbol key={kind} id={`emblem-${kind}`} viewBox="0 0 48 48">
            <path d={d} fill="currentColor" />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

export function Emblem({
  kind,
  className,
  title,
}: {
  kind: EmblemKind;
  className?: string;
  title?: string;
}) {
  const a11y = title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };

  if (kind in emblemPaths) {
    return (
      <svg viewBox="0 0 48 48" className={className} {...a11y}>
        <use href={`#emblem-${kind}`} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} {...a11y}>
      {kind === "independent" && (
        <>
          <path d="M24 4 27 21 44 24 27 27 24 44 21 27 4 24 21 21Z" />
          <circle cx={24} cy={24} r={9} strokeOpacity={0.45} />
        </>
      )}
      {kind === "lily" && (
        <>
          <path d="M24 6c-4 5-4.6 11-1.4 17.5h2.8C28.6 17 28 11 24 6Z" />
          <path d="M22.6 23.5c-3.6-1-6.8-.3-8.6 2.6-1.5 2.4-.6 5.6 2.4 6.2-1.6-3.2.5-6 6.2-5.2M25.4 23.5c3.6-1 6.8-.3 8.6 2.6 1.5 2.4.6 5.6-2.4 6.2 1.6-3.2-.5-6-6.2-5.2" />
          <path d="M16 27h16M19.5 27c0 6-2.5 10-5.5 13M28.5 27c0 6 2.5 10 5.5 13M24 27v15" />
        </>
      )}
      {kind === "jolly-roger" && (
        <>
          <path d="M14.5 20.5C14.5 13.6 18.8 9 24 9s9.5 4.6 9.5 11.5c0 3.4-1.4 5.6-3.4 7v4h-12.2v-4c-2-1.4-3.4-3.6-3.4-7Z" />
          <circle cx={20} cy={21} r={2.6} fill="currentColor" />
          <circle cx={28} cy={21} r={2.6} fill="currentColor" />
          <path d="M22.5 31.5v-3M25.5 31.5v-3M8 34l32 7.5M40 34 8 41.5" />
        </>
      )}
    </svg>
  );
}
