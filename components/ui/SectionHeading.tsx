import type { ReactNode } from "react";

/** Crimson bar + spaced serif title, the section heading used across the site. */
export function SectionHeading({
  title,
  kicker,
  id,
  tone = "dark",
  children,
}: {
  title: string;
  kicker?: string;
  id?: string;
  tone?: "dark" | "light";
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="flex gap-5">
        <span aria-hidden className={`mt-1 shrink-0 self-stretch ${tone === "light" ? "w-[3px] bg-crimson" : "accent-bar"}`} />
        <div>
          <h2
            id={id}
            className={`display text-[clamp(1.6rem,2.6vw,2.4rem)] tracking-[0.18em] ${tone === "light" ? "text-parchment-ink" : "text-bone"}`}
          >
            {title}
          </h2>
          {kicker && (
            <p className={`label mt-2 ${tone === "light" ? "text-crimson" : "text-crimson-bright"}`}>{kicker}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
