"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Scene } from "@/components/scene/Scene";
import { Emblem } from "@/components/ui/Emblem";
import { Portrait } from "@/components/ui/Portrait";
import { factionLabel } from "@/data/catalog";
import type { Faction } from "@/data/types";
import type { ArtMap } from "@/lib/art";
import { chronoKey, directoryCharacters, displayName, eraName, getCharacter, hasProfile, lifespan } from "@/lib/data";
import { connectionCount, groupsFor, type Category } from "@/lib/relations";
import { search } from "@/lib/search";
import { allCategories, RelationshipMap } from "./RelationshipMap";

const DEFAULT = "ezio";

export function Explorer({ art }: { art: ArtMap }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("focus");
  const focusId = requested && getCharacter(requested) ? requested : DEFAULT;
  const focus = getCharacter(focusId)!;

  const [faction, setFaction] = useState<Faction | "all">("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<Category>>(allCategories);

  const select = (id: string) => {
    router.replace(`${pathname}?focus=${id}`, { scroll: false });
    document.getElementById("map-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const list = useMemo(() => {
    const base = directoryCharacters.filter((c) => connectionCount(c.id) > 0);
    const found = query.trim() ? search(base, query).map((h) => h.character) : [...base].sort((a, b) => chronoKey(a) - chronoKey(b));
    return found.filter((c) => faction === "all" || c.faction === faction);
  }, [faction, query]);

  const acrossEras = useMemo(() => {
    const g = groupsFor(focusId);
    const seen = new Set<string>();
    return Object.values(g)
      .flat()
      .filter((l) => l.person.era && l.person.era !== focus.era && !seen.has(l.person.id) && seen.add(l.person.id));
  }, [focusId, focus.era]);

  const p = focus.palette ?? { accent: "#a4824f", sky: "#2a2520", ground: "#11100e" };
  const focusArt = art[focus.id];

  return (
    <div className="mx-auto grid max-w-[1700px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[21rem_minmax(0,1fr)]">
      {/* ── Sidebar ── */}
      <aside className="border-line px-4 pb-8 pt-[calc(var(--header-h)+2.5rem)] sm:px-8 lg:sticky lg:top-0 lg:h-dvh lg:overflow-hidden lg:border-r lg:px-6">
        <div className="flex h-full flex-col">
          <p className="label text-crimson-bright">Explore</p>
          <h1 className="display mt-2 text-[2rem] tracking-[0.12em]">Relationships</h1>
          <p className="mt-3 text-[1rem] leading-relaxed text-bone-dim">
            The bonds, rivalries and lines of descent between the people of the archive. Choose anyone to put them at the
            centre.
          </p>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter list by affiliation">
            {(["all", ...Object.keys(factionLabel)] as (Faction | "all")[]).map((f) => (
              <button
                key={f}
                onClick={() => setFaction(f)}
                aria-pressed={faction === f}
                className={`border px-3 py-1.5 font-display text-[0.62rem] uppercase tracking-[0.14em] transition-colors ${
                  faction === f ? "border-crimson-bright bg-crimson/20 text-bone" : "border-line-strong text-bone-dim hover:text-bone"
                }`}
              >
                {f === "all" ? "All" : f === "brotherhood" ? "Assassins" : f === "templar" ? "Templars" : "Independent"}
              </button>
            ))}
          </div>

          <div className="mt-4 flex h-10 items-center gap-2 border border-line-strong px-3">
            <Search aria-hidden className="size-4 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="Find a character…"
              aria-label="Find a character to centre the map on"
              className="min-w-0 flex-1 bg-transparent font-sans text-sm placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button aria-label="Clear" onClick={() => setQuery("")} className="text-muted hover:text-bone">
                <X className="size-4" />
              </button>
            )}
          </div>

          <ul className="scroll-strip -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:block lg:flex-1 lg:space-y-0.5 lg:overflow-y-auto lg:px-0 lg:[scrollbar-width:thin]">
            {list.map((c) => {
              const on = c.id === focusId;
              return (
                <li key={c.id} className="shrink-0">
                  <button
                    onClick={() => select(c.id)}
                    aria-current={on ? "true" : undefined}
                    className={`flex w-full items-center gap-3 border-l-2 py-2 pl-3 pr-2 text-left transition-colors ${
                      on ? "border-crimson-bright bg-crimson/15" : "border-transparent hover:bg-ink-800"
                    }`}
                  >
                    <Portrait character={c} src={art[c.id]?.portrait} sizes="40px" className="h-11 w-8 shrink-0" monogramSize="text-[0.6rem]" />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-display text-[0.78rem] tracking-[0.06em] ${on ? "text-bone" : "text-bone-dim"}`}>
                        {displayName(c)}
                      </span>
                      <span className="block truncate font-sans text-[0.68rem] text-muted">{lifespan(c)}</span>
                    </span>
                    <span className="hidden font-sans text-[0.66rem] text-muted lg:block" title="Recorded connections">
                      {connectionCount(c.id)}
                    </span>
                  </button>
                </li>
              );
            })}
            {!list.length && <li className="px-3 py-4 font-sans text-sm text-muted">No one matches.</li>}
          </ul>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="min-w-0 lg:pt-[var(--header-h)]">
        <div id="map-top" className="relative isolate overflow-hidden border-b border-line" style={{ "--accent": p.accent } as React.CSSProperties}>
          {focusArt?.scene || focusArt?.render ? (
            <div key={focus.id} aria-hidden className="fade-in absolute inset-0 -z-10 opacity-75">
              <Scene
                character={focus}
                art={focusArt}
                scenePosition={focus.framing?.hero ?? "50% 40%"}
                sceneSizes="80vw"
                figureSizes="20vw"
                figureClass="left-[87%] top-[10%] h-[300%]"
              />
            </div>
          ) : (
            <div key={focus.id} aria-hidden className="fade-in absolute inset-0 -z-10" style={{ background: `radial-gradient(70% 140% at 75% 0%, ${p.sky} 0%, transparent 70%)` }} />
          )}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950 via-ink-950/75 to-ink-950/50" />
          <div key={focus.id} className="rise-in flex flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:px-8 lg:px-12">
            <div className="min-w-0 flex-1">
              <p className="label text-bone-dim">
                {[eraName(focus), lifespan(focus)].filter(Boolean).join(" · ") || "Relationship map"}
              </p>
              <h2 className="display mt-3 text-[clamp(1.8rem,3.2vw,2.8rem)] tracking-[0.14em]">{focus.name}</h2>
              <p className="mt-3 max-w-2xl text-[1.08rem] leading-relaxed text-bone-dim">{focus.role}</p>
              {focus.affiliations.length > 0 && (
                <p className="mt-3 flex items-center gap-2 font-sans text-xs text-muted">
                  <Emblem kind={focus.faction} className="size-4 text-[color:var(--accent)]" />
                  {focus.affiliations.join(" · ")}
                </p>
              )}
            </div>
            {hasProfile(focus) && (
              <Link href={`/characters/${focus.id}`} className="btn-outline self-start bg-ink-950/70 backdrop-blur-sm sm:self-auto">
                Open profile <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="px-4 py-10 sm:px-8 lg:px-12">
          <RelationshipMap
            focusId={focusId}
            art={art}
            mode="explore"
            onSelect={select}
            sideColumns={2}
            wideFrom="xl"
            active={active}
            onToggleCategory={(c) =>
              setActive((s) => {
                const next = new Set(s);
                if (next.has(c)) next.delete(c);
                else next.add(c);
                return next;
              })
            }
          />
          <p className="mt-8 font-sans text-xs text-muted">
            Select any portrait to move them to the centre. Characters with a dossier can be opened from the panel above.
          </p>
        </div>

        {acrossEras.length > 0 && (
          <section aria-labelledby="across-eras" className="border-t border-line px-4 py-10 sm:px-8 lg:px-12">
            <h2 id="across-eras" className="label flex items-center gap-3 text-bone">
              <span className="h-4 w-[2px] bg-crimson" /> Across the eras
            </h2>
            <ul className="scroll-strip mt-5 flex gap-4 overflow-x-auto">
              {acrossEras.map((l) => (
                <li key={l.person.id} className="w-56 shrink-0">
                  <button onClick={() => select(l.person.id)} className="group flex w-full items-center gap-3 border border-line p-2 text-left hover:border-bone-dim/50">
                    <Portrait character={l.person} src={art[l.person.id]?.portrait} sizes="48px" className="h-14 w-11 shrink-0" monogramSize="text-xs" />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[0.75rem] tracking-[0.06em] text-bone">{displayName(l.person)}</span>
                      <span className="block truncate font-sans text-[0.68rem] text-muted">
                        {l.role} · {eraName(l.person)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
