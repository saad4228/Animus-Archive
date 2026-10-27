/* eslint-disable @next/next/no-img-element --
   Plates are static pre-sized WebP chosen through srcset, like everywhere else on
   the profile; next/image would only add a resize at request time. */
import type { TimelineEvent } from "@/data/types";
import { srcSet, type Art } from "@/lib/art";

/**
 * Key moments as a rail of archival plates.
 *
 * Each plate is official art from that character's own game, cycled over the
 * events — there is no artwork of the events themselves, and inventing some
 * would be a picture of something that never happened.
 */
export function KeyMoments({ events, art }: { events: TimelineEvent[]; art: Art }) {
  const last = events.length - 1;
  return (
    <div className="scroll-strip overflow-x-auto pb-2">
      <ol className="flex min-w-max gap-5 lg:gap-6 2xl:min-w-0">
        {events.map((e, i) => {
          const plate = art.moments[i % art.moments.length];
          return (
            <li key={i} className="w-[13.5rem] shrink-0 sm:w-[15rem] 2xl:w-auto 2xl:flex-1">
              <figure className="plate relative aspect-[5/3] overflow-hidden bg-ink-900">
                {plate ? (
                  <img
                    src={plate.src}
                    srcSet={srcSet(plate)}
                    sizes="15rem"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                    style={{ objectPosition: "50% 40%", filter: "saturate(0.88) contrast(1.04) brightness(0.8)" }}
                  />
                ) : (
                  <span aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_30%,var(--sky),var(--ground))] opacity-70" />
                )}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-transparent" />
                <span aria-hidden className="absolute inset-0 shadow-[inset_0_0_28px_rgb(0_0_0/0.7)]" />
              </figure>

              {/* The rail runs under the plates, through each moment's marker. */}
              <div className="relative my-4 h-[11px]">
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 h-px -translate-y-1/2 bg-line-strong ${i === last ? "w-full" : "w-[calc(100%+1.25rem)] lg:w-[calc(100%+1.5rem)]"}`}
                />
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 size-[11px] -translate-y-1/2 rounded-full border-[1.5px] border-crimson-bright bg-ink-950 shadow-[0_0_7px_rgb(214_34_43/0.7)]"
                />
              </div>

              <p className="font-display text-[1.45rem] leading-none tracking-[0.05em] text-[color:var(--accent)]">{e.date}</p>
              <h3 className="mt-2.5 font-display text-[0.74rem] uppercase leading-snug tracking-[0.13em] text-bone">{e.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-bone-dim">{e.body}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
