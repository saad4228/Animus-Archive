"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Portrait } from "@/components/ui/Portrait";
import type { ArtMap } from "@/lib/art";
import { useBookmarks } from "@/lib/bookmarks";
import { displayName, getCharacter, lifespan } from "@/lib/data";

export function BookmarksDrawer({ open, onClose, art }: { open: boolean; onClose: () => void; art: ArtMap }) {
  const { ids, toggle } = useBookmarks();
  const panelRef = useRef<HTMLDivElement>(null);
  const saved = ids.map(getCharacter).filter((c) => c !== undefined);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close bookmarks" onClick={onClose} className="fade-in absolute inset-0 bg-black/60" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmarks-title"
        tabIndex={-1}
        className="rise-in absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-line bg-ink-900 focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 id="bookmarks-title" className="display text-lg tracking-[0.16em]">
              Bookmarks
            </h2>
            <p className="mt-1 font-sans text-xs text-muted">Saved in this browser only.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center text-bone-dim hover:text-bone">
            <X className="size-5" />
          </button>
        </div>

        {saved.length ? (
          <ul className="flex-1 overflow-y-auto">
            {saved.map((c) => (
              <li key={c.id} className="flex items-center gap-4 border-b border-line px-6 py-3">
                <Portrait character={c} src={art[c.id]?.portrait} sizes="48px" className="h-16 w-11 shrink-0" monogramSize="text-xs" />
                <Link href={`/characters/${c.id}`} onClick={onClose} className="min-w-0 flex-1 hover:text-gold">
                  <span className="block truncate font-display text-sm tracking-[0.08em]">{displayName(c)}</span>
                  <span className="block font-sans text-xs text-muted">{lifespan(c)}</span>
                </Link>
                <button
                  onClick={() => toggle(c.id)}
                  className="font-sans text-xs text-muted underline-offset-4 hover:text-crimson-bright hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10 text-center">
            <span className="diamond size-3 text-crimson-bright" />
            <p className="text-bone-dim">
              Nothing saved yet. Use the bookmark on any character card or profile to keep them here.
            </p>
            <Link href="/characters" onClick={onClose} className="btn-outline mt-2">
              Browse characters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
