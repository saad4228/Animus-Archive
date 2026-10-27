import type { Metadata } from "next";
import Image from "next/image";
import { Directory } from "@/components/characters/Directory";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getArtMap, getBanner, getEraScenes } from "@/lib/art";

export const metadata: Metadata = {
  title: "Characters",
  description: "Search and filter the protagonists, playable characters and modern-day figures of Assassin's Creed.",
};

export default function CharactersPage() {
  const art = getArtMap();
  const banner = getBanner("characters");
  return (
    <>
      <header className="grain relative overflow-hidden pb-14 pt-[calc(var(--header-h)+4.5rem)]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 120% at 50% 0%, #3a2418 0%, transparent 62%), radial-gradient(40% 80% at 85% 40%, #1f2f3a 0%, transparent 70%), radial-gradient(40% 80% at 12% 50%, #3b2a14 0%, transparent 70%), var(--ink-950)",
          }}
        />
        {banner && (
          <Image src={banner.src} alt="" fill priority sizes="100vw" className="object-cover object-top" />
        )}
        {/* Enough shade for the title to read, with the cast still visible around it. */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(46%_70%_at_50%_52%,rgb(11_10_9/0.86),rgb(11_10_9/0.5)_58%,rgb(11_10_9/0.2))]" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-950 via-ink-950/50 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />

        <div className="relative z-10 mx-auto max-w-[1600px] px-4 text-center sm:px-8 [text-shadow:0_2px_18px_rgb(0_0_0/0.9)]">
          <p className="eyebrow">The Animus Archive</p>
          <h1 className="display mt-5 text-[clamp(2.2rem,5vw,4.2rem)] tracking-[0.14em]">
            Lives in the <span className="text-crimson-bright">Archive</span>
          </h1>
          <div className="diamond-rule mt-6 justify-center">
            <span className="diamond" />
          </div>
          <p className="label mt-5 text-bone-dim">Protagonists · Playable characters · The modern day</p>
          <p className="mx-auto mt-6 max-w-xl text-lg italic text-bone-dim">
            Different peoples, different eras. Choose an era on the line below, or narrow the archive by role, faction
            and game.
          </p>
        </div>
      </header>
      <Directory art={art} eraScenes={getEraScenes()} />
      <SiteFooter />
    </>
  );
}
