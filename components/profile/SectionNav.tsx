"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Left-rail section menu. It appears once the hero has scrolled away (the hero's
 * own margin holds the epigraph) and marks the section currently in view.
 *
 * Lookups are scoped to this profile's <article>: Next.js keeps previously
 * visited profiles in the DOM (hidden), so a bare getElementById("biography")
 * could find another character's section.
 */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(sections[0]?.id);
  const [visible, setVisible] = useState(false);

  const find = (id: string) => navRef.current?.closest("article")?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) ?? null;

  useEffect(() => {
    const scope = navRef.current?.closest("article");
    if (!scope) return;
    const byId = (id: string) => scope.querySelector<HTMLElement>(`#${CSS.escape(id)}`);

    const hero = byId("overview");
    const heroObs = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), { rootMargin: "-45% 0px 0px 0px" });
    if (hero) heroObs.observe(hero);

    const spy = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setCurrent(hit.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => {
      const el = byId(s.id);
      if (el) spy.observe(el);
    });
    return () => {
      heroObs.disconnect();
      spy.disconnect();
    };
  }, [sections]);

  return (
    <nav
      ref={navRef}
      aria-label="On this page"
      // The sections are a 1600px column, so the rail only has a margin to sit in
      // from 1920px up — below that it ran straight over the headings. Its left
      // edge tracks that margin, instead of being stranded at the viewport edge
      // on a wide screen.
      style={{ left: "max(1.5rem, calc(50vw - 800px - 8.5rem))" }}
      className={`fixed top-1/2 z-30 hidden -translate-y-1/2 transition-opacity duration-300 min-[1920px]:block ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ol className="space-y-3 border-l border-line py-1">
        {sections.map((s) => {
          const on = s.id === current;
          return (
            <li key={s.id} className="relative">
              {on && <span aria-hidden className="absolute -left-[4px] top-1/2 size-[7px] -translate-y-1/2 rounded-full bg-crimson-bright" />}
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  const el = find(s.id);
                  if (!el) return;
                  e.preventDefault();
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                aria-current={on ? "location" : undefined}
                className={`label block pl-5 text-[0.64rem] transition-colors ${on ? "text-bone" : "text-muted hover:text-bone-dim"}`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
