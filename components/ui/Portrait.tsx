import Image from "next/image";
import type { Character } from "@/data/types";
import { initials } from "@/lib/data";
import { Emblem } from "./Emblem";

const fallbackPalette = { accent: "#a4824f", sky: "#2a2520", ground: "#11100e" };

/**
 * A character portrait, or — when no art exists yet — a deliberate empty state
 * in the character's palette with their initials. Never a stand-in photo.
 */
export function Portrait({
  character,
  src,
  sizes,
  priority,
  position = "50% 22%",
  className = "",
  monogramSize = "text-3xl",
}: {
  character: Character;
  src?: string;
  sizes: string;
  priority?: boolean;
  position?: string;
  className?: string;
  monogramSize?: string;
}) {
  const p = character.palette ?? fallbackPalette;
  return (
    // Callers that position the portrait themselves (absolute inset-0) must not also get `relative`.
    <div className={`overflow-hidden ${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={character.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition: position }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 80% at 50% 18%, ${p.sky} 0%, ${p.ground} 72%)`,
          }}
          role="img"
          aria-label={`${character.name} (portrait not yet added)`}
        >
          <Emblem
            kind={character.faction}
            className="absolute left-1/2 top-[38%] w-[62%] -translate-x-1/2 -translate-y-1/2 opacity-[0.09]"
          />
          <span
            className={`display absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 tracking-[0.12em] ${monogramSize}`}
            style={{ color: p.accent }}
          >
            {initials(character)}
          </span>
        </div>
      )}
    </div>
  );
}
