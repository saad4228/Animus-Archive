"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Portrait } from "@/components/ui/Portrait";
import type { ArtMap } from "@/lib/art";
import { directoryCharacters, displayName, eraName, lifespan } from "@/lib/data";
import { search } from "@/lib/search";

const MAX = 7;

/**
 * Header search: a combobox over the directory. Arrow keys move, Enter opens the
 * profile, Escape closes the list and a second Escape clears the query.
 */
export function SearchBox({ art, onNavigate, autoFocus }: { art: ArtMap; onNavigate?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const hits = useMemo(() => search(directoryCharacters, query).slice(0, MAX), [query]);
  const showList = open && query.trim().length > 0;

  // "/" focuses search from anywhere that isn't already a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    onNavigate?.();
    router.push(`/characters/${id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (hits.length ? (i + 1) % hits.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (hits.length ? (i - 1 + hits.length) % hits.length : 0));
    } else if (e.key === "Enter") {
      if (showList && hits[active]) {
        e.preventDefault();
        go(hits[active].character.id);
      }
    } else if (e.key === "Escape") {
      if (showList) setOpen(false);
      else setQuery("");
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="group flex h-10 items-center gap-2.5 border border-line-strong bg-ink-950/60 px-3 transition-colors focus-within:border-bone-dim/60">
        <Search aria-hidden className="size-4 shrink-0 text-bone-dim" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
          aria-label="Search characters, games or eras"
          placeholder="Search characters, games or eras…"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent font-sans text-[0.85rem] text-bone placeholder:text-muted focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-muted hover:text-bone"
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="hidden border border-line px-1.5 font-sans text-[0.68rem] text-muted lg:block">/</kbd>
        )}
      </div>

      {showList && (
        <div className="rise-in absolute left-0 right-0 top-[calc(100%+6px)] z-50 border border-line-strong bg-ink-900/98 shadow-2xl shadow-black/60 backdrop-blur-sm">
          {hits.length ? (
            <ul id={listId} role="listbox" aria-label="Matching characters" className="py-1.5">
              {hits.map((h, i) => {
                const c = h.character;
                const meta = [lifespan(c), eraName(c)].filter(Boolean).join(" · ");
                const matchedOther = h.matched !== c.name && h.matched !== c.shortName;
                return (
                  <li
                    key={c.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => go(c.id)}
                    className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-crimson/15" : ""}`}
                  >
                    <span className={`w-[3px] self-stretch ${i === active ? "bg-crimson-bright" : "bg-transparent"}`} />
                    <Portrait
                      character={c}
                      src={art[c.id]?.portrait}
                      sizes="40px"
                      className="h-12 w-9 shrink-0 border border-line"
                      monogramSize="text-[0.7rem]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[0.82rem] tracking-[0.08em] text-bone">
                        {displayName(c)}
                      </span>
                      <span className="block truncate font-sans text-[0.72rem] text-muted">
                        {matchedOther ? `Matches “${h.matched}”` : meta}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p id={listId} className="px-4 py-4 font-sans text-[0.8rem] text-bone-dim">
              No one in the archive matches “{query.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
