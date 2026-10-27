import Link from "next/link";
import { Emblem } from "@/components/ui/Emblem";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink-950">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr_1.4fr]">
        <div className="flex items-start gap-4">
          <Emblem kind="seal" className="size-12 shrink-0 text-bone-dim" />
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em]">The Animus Archive</p>
            <p className="label mt-2 text-muted">People · Choices · History</p>
          </div>
        </div>
        <nav aria-label="Footer" className="flex gap-8 font-display text-[0.75rem] uppercase tracking-[0.2em] text-bone-dim">
          <Link href="/" className="hover:text-bone">Home</Link>
          <Link href="/characters" className="hover:text-bone">Characters</Link>
          <Link href="/relationships" className="hover:text-bone">Relationships</Link>
        </nav>
        <p className="font-sans text-[0.78rem] leading-relaxed text-muted">
          An unofficial fan archive. Not affiliated with or endorsed by Ubisoft. Assassin&apos;s Creed and its
          characters belong to Ubisoft Entertainment. Facts are checked against the community Assassin&apos;s Creed
          Wiki and Wikipedia; every profile lists its sources.
        </p>
      </div>
    </footer>
  );
}
