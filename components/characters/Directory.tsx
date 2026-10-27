"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import { Emblem } from "@/components/ui/Emblem";
import { useMemo, useState } from "react";
import { eras, factionLabel, gameById, games } from "@/data/catalog";
import type { Character, EraId, Faction, GameId } from "@/data/types";
import type { ArtMap } from "@/lib/art";
import { useBookmarks } from "@/lib/bookmarks";
import { chronoKey, directoryCharacters, displayName, firstRelease } from "@/lib/data";
import { search } from "@/lib/search";
import { CharacterCard } from "./CharacterCard";

type RoleFilter = "protagonist" | "playable" | "modern";
type Sort = "chrono" | "name" | "release";

const roleLabel: Record<RoleFilter, string> = {
  protagonist: "Main protagonists",
  playable: "Other playable",
  modern: "Modern day",
};

const roleMatch: Record<RoleFilter, (c: Character) => boolean> = {
  protagonist: (c) => !!c.protagonist,
  playable: (c) => !!c.playable && !c.protagonist,
  modern: (c) => !!c.modernDay,
};

const sortLabel: Record<Sort, string> = { chrono: "Era", name: "Name", release: "Release" };

const sortBy: Record<Sort, (a: Character, b: Character) => number> = {
  chrono: (a, b) => chronoKey(a) - chronoKey(b),
  name: (a, b) => displayName(a).localeCompare(displayName(b)),
  release: (a, b) => firstRelease(a) - firstRelease(b) || chronoKey(a) - chronoKey(b),
};

/** Fixed data, so counted once rather than on every render. */
const eraCounts = directoryCharacters.reduce((m, c) => (c.era ? m.set(c.era, (m.get(c.era) ?? 0) + 1) : m), new Map<string, number>());

function toggle<T>(set: Set<T>, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/**
 * Filters combine with AND across groups and OR within a group:
 * (protagonist OR modern) AND (templar) AND era AND game AND bookmarked AND query.
 */
export function Directory({ art, eraScenes }: { art: ArtMap; eraScenes: Record<string, string> }) {
  const { has: isBookmarked } = useBookmarks();
  const [era, setEra] = useState<EraId | "all">("all");
  const [roles, setRoles] = useState<Set<RoleFilter>>(new Set());
  const [factions, setFactions] = useState<Set<Faction>>(new Set());
  const [game, setGame] = useState<GameId | "all">("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("chrono");
  const [panelOpen, setPanelOpen] = useState(false);

  const q = query.trim();
  const results = useMemo(() => {
    const list = (q ? search(directoryCharacters, q).map((h) => h.character) : directoryCharacters).filter(
      (c) =>
        (era === "all" || c.era === era) &&
        (!roles.size || [...roles].some((r) => roleMatch[r](c))) &&
        (!factions.size || factions.has(c.faction)) &&
        (game === "all" || c.games.includes(game)) &&
        (!savedOnly || isBookmarked(c.id)),
    );
    // Relevance order wins while searching.
    return q ? list : [...list].sort(sortBy[sort]);
  }, [era, roles, factions, game, savedOnly, q, sort, isBookmarked]);

  const chips: { key: string; label: string; clear: () => void }[] = [
    ...(era !== "all" ? [{ key: "era", label: eras.find((e) => e.id === era)!.name, clear: () => setEra("all") }] : []),
    ...[...roles].map((r) => ({ key: r, label: roleLabel[r], clear: () => setRoles((s) => toggle(s, r)) })),
    ...[...factions].map((f) => ({ key: f, label: factionLabel[f], clear: () => setFactions((s) => toggle(s, f)) })),
    ...(game !== "all" ? [{ key: "game", label: gameById[game].short, clear: () => setGame("all") }] : []),
    ...(savedOnly ? [{ key: "saved", label: "Bookmarked", clear: () => setSavedOnly(false) }] : []),
    ...(q ? [{ key: "q", label: `“${q}”`, clear: () => setQuery("") }] : []),
  ];

  const clearAll = () => {
    setEra("all");
    setRoles(new Set());
    setFactions(new Set());
    setGame("all");
    setSavedOnly(false);
    setQuery("");
  };

  return (
    <>
      <EraTimeline value={era} onChange={setEra} counts={eraCounts} scenes={eraScenes} />

      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 pb-24 pt-12 sm:px-8 lg:grid-cols-[15rem_1fr] xl:gap-14">
        {/* ── Filters ── */}
        <aside aria-label="Filters" className={`${panelOpen ? "block" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="label text-bone">
                <span className="mr-3 inline-block h-3 w-[2px] translate-y-[1px] bg-crimson" />
                Filter
              </h2>
              <button
                onClick={clearAll}
                disabled={!chips.length}
                className="font-sans text-xs text-muted underline-offset-4 enabled:hover:text-bone enabled:hover:underline disabled:opacity-40"
              >
                Clear all
              </button>
            </div>

            <FilterGroup title="Role">
              {(Object.keys(roleLabel) as RoleFilter[]).map((r) => (
                <Check key={r} label={roleLabel[r]} checked={roles.has(r)} onChange={() => setRoles((s) => toggle(s, r))} />
              ))}
            </FilterGroup>

            <FilterGroup title="Affiliation">
              {(Object.keys(factionLabel) as Faction[]).map((f) => (
                <Check key={f} label={factionLabel[f]} checked={factions.has(f)} onChange={() => setFactions((s) => toggle(s, f))} />
              ))}
            </FilterGroup>

            <FilterGroup title="Game">
              <label className="sr-only" htmlFor="game-filter">
                Game appearance
              </label>
              <select
                id="game-filter"
                value={game}
                onChange={(e) => setGame(e.target.value as GameId | "all")}
                className="w-full border border-line-strong bg-ink-900 px-3 py-2 font-sans text-[0.85rem] text-bone"
              >
                <option value="all">All games</option>
                {games
                  .filter((g) => directoryCharacters.some((c) => c.games.includes(g.id)))
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.year})
                    </option>
                  ))}
              </select>
            </FilterGroup>

            <FilterGroup title="Collection">
              <Check label="Bookmarked only" checked={savedOnly} onChange={() => setSavedOnly((v) => !v)} />
            </FilterGroup>
          </div>
        </aside>

        {/* ── Grid ── */}
        <section aria-labelledby="directory-title" className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-line pb-5">
            <h2 id="directory-title" className="display text-2xl tracking-[0.32em]">
              <span className="mr-4 inline-block h-6 w-[3px] translate-y-[2px] bg-crimson" />
              Characters
            </h2>
            <p className="font-sans text-sm text-muted" aria-live="polite">
              {results.length} of {directoryCharacters.length}
            </p>

            <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
              <div className="flex h-10 flex-1 items-center gap-2 border border-line-strong px-3 sm:w-64 sm:flex-none">
                <Search aria-hidden className="size-4 text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                  placeholder="Filter by name, game…"
                  aria-label="Filter characters by name, alias, game or era"
                  className="min-w-0 flex-1 bg-transparent font-sans text-sm text-bone placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button aria-label="Clear filter text" onClick={() => setQuery("")} className="text-muted hover:text-bone">
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setPanelOpen((o) => !o)}
                aria-expanded={panelOpen}
                className="flex h-10 items-center gap-2 border border-line-strong px-3 font-sans text-sm lg:hidden"
              >
                <SlidersHorizontal className="size-4" /> Filters
              </button>
            </div>

            <div className="flex items-center gap-1 font-display text-[0.72rem] uppercase tracking-[0.16em]" role="group" aria-label="Sort by">
              <span className="mr-2 font-sans text-[0.7rem] normal-case tracking-normal text-muted">Sort</span>
              {(Object.keys(sortLabel) as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  aria-pressed={sort === s}
                  disabled={!!q}
                  title={q ? "Results are ordered by relevance while searching" : undefined}
                  className={`relative px-2.5 py-1.5 transition-colors disabled:opacity-40 ${
                    sort === s ? "text-crimson-bright" : "text-bone-dim hover:text-bone"
                  }`}
                >
                  {sortLabel[s]}
                  {sort === s && <span className="absolute inset-x-2.5 -bottom-px h-px bg-crimson-bright" />}
                </button>
              ))}
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Active filters">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    onClick={chip.clear}
                    className="flex items-center gap-2 border border-crimson/60 bg-crimson/10 px-3 py-1.5 font-sans text-xs text-bone hover:border-crimson-bright"
                  >
                    {chip.label}
                    <X aria-label="Remove filter" className="size-3.5 text-bone-dim" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {results.length ? (
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {results.map((c, i) => (
                <li key={c.id}>
                  <CharacterCard character={c} portrait={art[c.id]?.portrait} priority={i < 6} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-16 flex flex-col items-center gap-5 py-16 text-center">
              <span className="diamond size-3 text-crimson-bright" />
              <p className="max-w-md text-lg text-bone-dim">
                No one in the archive matches these filters.
                {savedOnly && " Bookmarks are saved in this browser — you may not have saved anyone yet."}
              </p>
              <button onClick={clearAll} className="btn-outline">
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-7">
      <legend className="label mb-3 text-muted">{title}</legend>
      <div className="flex flex-col gap-1">{children}</div>
    </fieldset>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 py-1.5 text-[1rem] transition-colors ${checked ? "text-bone" : "text-bone-dim hover:text-bone"}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`grid size-3.5 rotate-45 place-items-center border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-crimson-bright ${
          checked ? "border-crimson-bright bg-crimson" : "border-line-strong"
        }`}
      />
      {label}
    </label>
  );
}

function EraTimeline({
  value,
  onChange,
  counts,
  scenes,
}: {
  value: EraId | "all";
  onChange: (v: EraId | "all") => void;
  counts: Map<string, number>;
  scenes: Record<string, string>;
}) {
  const items = [{ id: "all" as const, name: "All eras", span: `${directoryCharacters.length} lives` }, ...eras.filter((e) => counts.has(e.id))];
  return (
    <nav aria-label="Filter by era" className="border-y border-line bg-ink-900/60">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <ol className="scroll-strip relative flex gap-3 overflow-x-auto pb-5 pt-5">
          <span aria-hidden className="absolute left-0 right-0 top-[1.55rem] h-px bg-line-strong" />
          {items.map((e) => {
            const active = value === e.id;
            const thumb = e.id === "all" ? undefined : scenes[e.id];
            return (
              <li key={e.id} className="relative min-w-[7rem] flex-1">
                <button
                  onClick={() => onChange(e.id)}
                  aria-pressed={active}
                  className="group flex w-full flex-col items-center gap-3 text-center"
                >
                  <span
                    className={`diamond relative z-10 size-[11px] transition-colors ${
                      active ? "border-crimson-bright bg-crimson shadow-[0_0_10px_rgb(214_34_43/0.8)]" : "border-bone-dim/60 bg-ink-900 group-hover:border-bone"
                    }`}
                  />
                  <span
                    className={`relative block aspect-[16/8] w-full overflow-hidden border transition-[border-color,box-shadow] ${
                      active ? "border-crimson-bright shadow-[0_0_22px_-4px_rgb(214_34_43/0.7)]" : "border-line group-hover:border-bone-dim/50"
                    }`}
                  >
                    {thumb ? (
                      <Image src={thumb} alt="" fill sizes="180px" className={`object-cover transition duration-500 ${active ? "" : "brightness-[0.7] saturate-[0.8] group-hover:brightness-90"}`} />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,#3a1a14,#11100e_75%)]">
                        <Emblem kind="seal" className="size-8 text-bone-dim" />
                      </span>
                    )}
                    {active && <span aria-hidden className="absolute inset-0 bg-crimson/15 mix-blend-multiply" />}
                  </span>
                  <span
                    className={`font-display text-[0.72rem] uppercase tracking-[0.14em] transition-colors ${
                      active ? "text-bone" : "text-bone-dim group-hover:text-bone"
                    }`}
                  >
                    {e.name}
                  </span>
                  <span className="-mt-2 font-sans text-[0.68rem] text-muted">
                    {"sortYear" in e ? `${e.span} · ${counts.get(e.id)}` : e.span}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
