import Link from "next/link";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { Emblem } from "@/components/ui/Emblem";
import { Portrait } from "@/components/ui/Portrait";
import type { Character } from "@/data/types";
import { displayName, lifespan } from "@/lib/data";

/**
 * Tall portrait card. The character's own setting fills the frame, which is what
 * keeps a grid of these from looking uniform. Selected = crimson wash + diamond.
 */
export function CharacterCard({
  character: c,
  portrait,
  selected,
  sizes = "(min-width: 1536px) 15vw, (min-width: 1024px) 20vw, (min-width: 640px) 30vw, 45vw",
  priority,
}: {
  character: Character;
  portrait?: string;
  selected?: boolean;
  sizes?: string;
  priority?: boolean;
}) {
  const name = displayName(c);
  const span = lifespan(c);
  return (
    <article className="group relative">
      <Link
        href={`/characters/${c.id}`}
        aria-describedby={`card-${c.id}-meta`}
        className={`relative block aspect-[2/3] overflow-hidden border transition-colors duration-300 ${
          selected ? "border-crimson-bright" : "border-line hover:border-[color:var(--accent)]"
        }`}
        style={{ "--accent": c.palette?.accent } as React.CSSProperties}
      >
        <Portrait
          character={c}
          src={portrait}
          sizes={sizes}
          priority={priority}
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          monogramSize="text-4xl"
        />
        {selected && <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-crimson/30 via-crimson/10 to-transparent mix-blend-multiply" />}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-3 pb-5 text-center">
          <Emblem
            kind={c.faction}
            title={c.faction === "templar" ? "Templar" : c.faction === "brotherhood" ? "Assassin / Hidden One" : "Independent"}
            className={`mb-2.5 size-5 ${selected ? "text-crimson-bright" : "text-[color:var(--accent)]"}`}
          />
          <h3 className="display text-balance text-[0.95rem] leading-[1.2] tracking-[0.1em] text-bone sm:text-[1.02rem]">
            {name}
          </h3>
          <p id={`card-${c.id}-meta`} className="mt-2 font-sans text-[0.7rem] tracking-[0.12em] text-bone-dim uppercase">
            {span && <span className="block">{span}</span>}
            {c.setting && <span className="mt-0.5 block text-muted">{c.setting}</span>}
          </p>
        </div>
      </Link>
      {selected && (
        <span aria-hidden className="diamond absolute -bottom-[5px] left-1/2 size-[9px] -translate-x-1/2 border-crimson-bright bg-ink-950" />
      )}
      <BookmarkButton
        id={c.id}
        name={name}
        className="absolute right-2 top-2 grid size-8 place-items-center bg-ink-950/55 opacity-80 backdrop-blur-sm hover:opacity-100"
      />
    </article>
  );
}
