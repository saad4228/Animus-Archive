"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Portrait } from "@/components/ui/Portrait";
import type { Character } from "@/data/types";
import type { ArtMap } from "@/lib/art";
import { displayName, getCharacter, hasProfile, lifespan } from "@/lib/data";
import { categories, groupsFor, slotLabels, type Category, type Link as RelLink, type Slot } from "@/lib/relations";
import { lineStyle, slotCategory, Swatch } from "./encoding";

// Slot ids double as CSS grid-area names.
const SLOTS: Slot[] = ["family", "mentors", "allies", "romance", "rivals", "next"];

interface Line {
  slot: Slot;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * The relationship map shared by profiles and the Relationships page.
 *
 * Groups sit in fixed slots around the focus (family above, mentors left, allies
 * right, love lower-left, rivals lower-right, next generation below). Lines are
 * measured from the rendered boxes, so they stay attached at any width.
 *
 * mode="profile": nodes link to profiles.
 * mode="explore": nodes re-centre the map via onSelect.
 */
export function RelationshipMap({
  focusId,
  art,
  mode,
  onSelect,
  active,
  onToggleCategory,
  sideColumns = 3,
  wideFrom = "lg",
}: {
  focusId: string;
  art: ArtMap;
  mode: "profile" | "explore";
  onSelect?: (id: string) => void;
  /** Categories currently shown at full strength. */
  active: Set<Category>;
  onToggleCategory: (c: Category) => void;
  /** Max portraits per row in the left and right boxes. */
  sideColumns?: number;
  /** Breakpoint where the map replaces the stacked list (later where the page has a sidebar). */
  wideFrom?: "lg" | "xl";
}) {
  const focus = getCharacter(focusId)!;
  const groups = useMemo(() => groupsFor(focusId), [focusId]);
  const present = SLOTS.filter((s) => groups[s].length);

  const wrapRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Partial<Record<Slot, HTMLDivElement | null>>>({});
  const [lines, setLines] = useState<Line[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const w = wrap.getBoundingClientRect();
      const c = circleRef.current?.getBoundingClientRect();
      const f = focusRef.current?.getBoundingClientRect();
      if (!c || !f || c.width === 0) return setLines([]);
      const cx = c.left + c.width / 2 - w.left;
      const cy = c.top + c.height / 2 - w.top;
      const r = c.width / 2;
      // The name sits under the circle; lines heading down start below it.
      const block = { l: f.left - w.left, r: f.right - w.left, b: f.bottom - w.top };
      const next: Line[] = [];
      for (const slot of present) {
        const box = boxRefs.current[slot]?.getBoundingClientRect();
        if (!box || box.width === 0) continue;
        const bx = { l: box.left - w.left, r: box.right - w.left, t: box.top - w.top, b: box.bottom - w.top };
        // Nearest point on the box to the focus centre.
        const px = Math.min(Math.max(cx, bx.l), bx.r);
        const py = Math.min(Math.max(cy, bx.t), bx.b);
        const dx = px - cx;
        const dy = py - cy;
        const len = Math.hypot(dx, dy) || 1;
        let t = r + 6;
        if (dy > 0) {
          // Leave through the focus block's edge (bottom or side, whichever comes first).
          const tb = (block.b + 6 - cy) / (dy / len);
          const ts = dx === 0 ? Infinity : ((dx > 0 ? block.r : block.l) - cx) / (dx / len);
          t = Math.max(t, Math.min(tb, ts + 6));
        }
        next.push({ slot, x1: cx + (dx / len) * t, y1: cy + (dy / len) * t, x2: px, y2: py });
      }
      setLines(next);
    };
    measure();
    // Boxes can reflow (wrapping, late-loading fonts) without the wrapper changing size.
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    for (const el of Object.values(boxRefs.current)) if (el) ro.observe(el);
    return () => ro.disconnect();
    // present is derived from focusId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const dim = (l: RelLink) => !active.has(l.category);
  const span = lifespan(focus);

  if (!present.length) {
    return (
      <p className="py-10 text-center text-bone-dim">
        No relationships for {displayName(focus)} are recorded in the archive yet.
      </p>
    );
  }

  return (
    <div>
      <Legend active={active} onToggle={onToggleCategory} />

      {/* Desktop: the map */}
      <div
        ref={wrapRef}
        className={`relative mt-8 hidden gap-x-10 gap-y-12 ${wideFrom === "xl" ? "xl:grid" : "lg:grid"}`}
        style={{
          gridTemplateColumns: "minmax(0,1fr) minmax(13rem,auto) minmax(0,1fr)",
          // Family and the next generation get full-width rows so they never widen the focus column.
          gridTemplateAreas: `"family family family" "mentors focus allies" "romance . rivals" "next next next"`,
        }}
      >
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {lines.map((l) => {
            const cat = slotCategory[l.slot];
            const s = lineStyle[cat];
            const faded = groups[l.slot].every(dim);
            return (
              <g key={l.slot} style={{ opacity: faded ? 0.15 : 0.9, transition: "opacity .25s" }}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" />
                <rect x={l.x2 - 3.5} y={l.y2 - 3.5} width={7} height={7} fill="var(--ink-950)" stroke={s.color} transform={`rotate(45 ${l.x2} ${l.y2})`} />
              </g>
            );
          })}
        </svg>

        <div ref={focusRef} style={{ gridArea: "focus" }} className="relative z-10 flex flex-col items-center self-center justify-self-center">
          <div ref={circleRef} className="relative size-44 rounded-full border border-crimson-bright p-1.5 shadow-[0_0_60px_-10px_rgb(184_20_29/0.55)]">
            <Portrait
              character={focus}
              src={art[focus.id]?.portrait}
              sizes="176px"
              className="size-full rounded-full"
              monogramSize="text-3xl"
            />
          </div>
          <p className="display mt-4 text-center text-[1.05rem] tracking-[0.14em]">{displayName(focus)}</p>
          {span && <p className="mt-1 font-sans text-xs text-muted">{span}</p>}
        </div>

        {present.map((slot) => (
          <div
            key={slot}
            ref={(el) => {
              boxRefs.current[slot] = el;
            }}
            style={{
              gridArea: slot,
              // Never wider than its column; side boxes cap at `sideColumns` portraits per row,
              // top and bottom at six. Portraits wrap onto new rows rather than overflowing.
              maxWidth: `min(100%, ${boxWidth(slot === "family" || slot === "next" ? 6 : sideColumns)})`,
            }}
            className={`relative z-10 min-w-0 self-center border border-line bg-ink-950/80 px-4 pb-4 pt-6 backdrop-blur-[2px] ${
              slot === "family" || slot === "next" ? "justify-self-center" : slot === "mentors" || slot === "romance" ? "justify-self-end" : "justify-self-start"
            }`}
          >
            <GroupTag slot={slot} />
            <ul className="flex flex-wrap justify-center gap-x-3 gap-y-5">
              {groups[slot].map((l) => (
                <li key={l.person.id + l.role}>
                  <Node link={l} art={art} mode={mode} onSelect={onSelect} faded={dim(l)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Narrow screens: stacked groups instead of a squeezed graph */}
      <div className={`mt-8 space-y-8 ${wideFrom === "xl" ? "xl:hidden" : "lg:hidden"}`}>
        {present.map((slot) => (
          <section key={slot} aria-label={slotLabels[slot]}>
            <h3 className="label flex items-center gap-3 text-bone-dim">
              <Swatch category={slotCategory[slot]} className="w-6" />
              {slotLabels[slot]}
            </h3>
            <ul className="scroll-strip -mx-4 mt-3 flex gap-3 overflow-x-auto px-4">
              {groups[slot].map((l) => (
                <li key={l.person.id + l.role} className="shrink-0">
                  <Node link={l} art={art} mode={mode} onSelect={onSelect} faded={dim(l)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Box width for `n` portraits per row: 6.5rem nodes, 0.75rem gaps, 1rem padding each side, borders. */
function boxWidth(n: number) {
  return `calc(${n} * 6.5rem + ${n - 1} * 0.75rem + 2rem + 2px)`;
}

function GroupTag({ slot }: { slot: Slot }) {
  const s = lineStyle[slotCategory[slot]];
  return (
    <span
      className="label absolute -top-[0.7rem] left-1/2 -translate-x-1/2 whitespace-nowrap border bg-ink-950 px-3 py-0.5 text-[0.66rem]"
      style={{ borderColor: s.color, color: s.color }}
    >
      {slotLabels[slot]}
    </span>
  );
}

function Node({
  link,
  art,
  mode,
  onSelect,
  faded,
}: {
  link: RelLink;
  art: ArtMap;
  mode: "profile" | "explore";
  onSelect?: (id: string) => void;
  faded: boolean;
}) {
  const p: Character = link.person;
  const body = (
    <>
      <span className="relative block">
        <Portrait
          character={p}
          src={art[p.id]?.portrait}
          sizes="72px"
          className="h-[5.25rem] w-[4.25rem] border border-line transition-colors group-hover:border-bone-dim"
          monogramSize="text-sm"
        />
        <span
          aria-hidden
          className="diamond absolute -bottom-[4px] left-1/2 size-[8px] -translate-x-1/2 bg-ink-950"
          style={{ color: lineStyle[link.category].color }}
        />
      </span>
      <span className="mt-2.5 block max-w-[6.5rem] text-center font-display text-[0.7rem] leading-snug tracking-[0.06em] text-bone">
        {displayName(p)}
      </span>
      <span className="block max-w-[6.5rem] text-center font-sans text-[0.66rem] leading-snug text-muted">{link.role}</span>
    </>
  );

  const shared = {
    title: [p.name, link.role, link.note, p.role].filter(Boolean).join(" — "),
    className: `group flex w-[6.5rem] flex-col items-center transition-opacity duration-300 ${faded ? "opacity-25" : ""}`,
  };

  if (mode === "explore" && onSelect)
    return (
      <button type="button" onClick={() => onSelect(p.id)} {...shared}>
        {body}
      </button>
    );
  if (hasProfile(p)) return <Link href={`/characters/${p.id}`} {...shared}>{body}</Link>;
  return <span {...shared}>{body}</span>;
}

export function Legend({ active, onToggle }: { active: Set<Category>; onToggle: (c: Category) => void }) {
  return (
    <div role="group" aria-label="Show relationship types" className="flex flex-wrap items-center gap-x-1 gap-y-2">
      <span className="label mr-3 text-muted">Relationship type</span>
      {categories.map((c) => {
        const on = active.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(c.id)}
            className={`flex items-center gap-2.5 border px-3 py-1.5 font-sans text-[0.75rem] transition-colors ${
              on ? "border-line-strong text-bone" : "border-transparent text-muted line-through decoration-muted/60"
            }`}
          >
            <Swatch category={c.id} className="w-7" />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

export const allCategories = () => new Set<Category>(categories.map((c) => c.id));
