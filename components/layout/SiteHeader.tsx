"use client";

import { Bookmark, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MusicPlayer } from "@/components/audio/MusicPlayer";
import { BookmarksDrawer } from "@/components/bookmarks/BookmarksDrawer";
import { SearchBox } from "@/components/search/SearchBox";
import { Emblem } from "@/components/ui/Emblem";
import type { ArtMap } from "@/lib/art";
import type { Track } from "@/lib/audio";
import { useBookmarks } from "@/lib/bookmarks";
import { useTrackNavigation } from "@/lib/history";

const nav = [
  { href: "/", label: "Home" },
  { href: "/characters", label: "Characters" },
  { href: "/relationships", label: "Relationships" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader({ art, tracks }: { art: ArtMap; tracks: Track[] }) {
  const pathname = usePathname();
  useTrackNavigation();
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { ids } = useBookmarks();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 h-[var(--header-h)] transition-[background-color,border-color] duration-300 ${
          solid || menuOpen
            ? "border-b border-line bg-ink-950/92 backdrop-blur-md"
            : // No border here: a transparent border lets the gradient repeat into it as a dark 1px line.
              "bg-gradient-to-b from-ink-950/45 to-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-6 px-4 sm:px-8">
          <Link href="/" className="group/logo flex shrink-0 items-center gap-3" aria-label="The Animus Archive, home">
            <Emblem kind="seal" className="size-11 text-bone transition-colors group-hover/logo:text-gold" />
            <span className="font-display text-[0.92rem] uppercase leading-[1.05] tracking-[0.2em] text-bone">
              The Animus
              <br />
              Archive
            </span>
          </Link>

          <nav aria-label="Main" className="ml-6 hidden flex-1 items-center gap-10 md:flex lg:ml-14">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-2 font-display text-[0.78rem] uppercase tracking-[0.22em] transition-colors ${
                    active ? "text-bone" : "text-bone-dim hover:text-bone"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span aria-hidden className="nav-active">
                      <span className="nav-active-diamond" />
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <MusicPlayer tracks={tracks} />
            <div className="hidden w-[min(20rem,24vw)] lg:block">
              <SearchBox art={art} />
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Bookmarks${ids.length ? ` (${ids.length})` : ""}`}
              className="relative grid size-10 place-items-center text-bone-dim transition-colors hover:text-bone"
            >
              <Bookmark className="size-5" fill={ids.length ? "currentColor" : "none"} />
              {ids.length > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-crimson px-1 font-sans text-[0.6rem] leading-4 text-bone">
                  {ids.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center text-bone lg:hidden"
            >
              {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="rise-in border-b border-line bg-ink-950/97 px-4 pb-6 pt-2 lg:hidden">
            <SearchBox art={art} onNavigate={() => setMenuOpen(false)} />
            <nav aria-label="Main" className="mt-4 flex flex-col">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={`border-b border-line py-3.5 font-display text-sm uppercase tracking-[0.22em] ${
                    isActive(pathname, item.href) ? "text-bone" : "text-bone-dim"
                  }`}
                >
                  {isActive(pathname, item.href) && <span className="diamond mr-3 border-crimson-bright" />}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <BookmarksDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} art={art} />
    </>
  );
}
