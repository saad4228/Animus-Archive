import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Biography } from "@/components/profile/Biography";
import { Gallery } from "@/components/profile/Gallery";
import { KeyMoments } from "@/components/profile/KeyMoments";
import { Legacy } from "@/components/profile/Legacy";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { SectionNav } from "@/components/profile/SectionNav";
import { ProfileMap } from "@/components/relationships/ProfileMap";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getArt, getArtMap } from "@/lib/art";
import { directoryCharacters, displayName, getCharacter } from "@/lib/data";
import { connectionCount } from "@/lib/relations";

// Profiles are fully static. This also makes an unknown slug wait for the whole
// page instead of streaming, so notFound() can answer with a real 404.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return directoryCharacters.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/characters/[slug]">): Promise<Metadata> {
  const c = getCharacter((await params).slug);
  if (!c?.directory) return { title: "Not in the archive" };
  return { title: c.name, description: c.role };
}

/** The dark sections between the hero and the close all share this frame. */
function Band({ id, title, kicker, action, pad = "py-20 lg:py-24", children }: { id: string; title: string; kicker?: string; action?: React.ReactNode; pad?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="archive grain relative border-t border-line">
      <div className={`relative z-10 mx-auto max-w-[1600px] px-4 sm:px-8 ${pad}`}>
        <SectionHeading id={`${id}-title`} title={title} kicker={kicker}>
          {action}
        </SectionHeading>
        {children}
      </div>
    </section>
  );
}

export default async function ProfilePage({ params }: PageProps<"/characters/[slug]">) {
  const { slug } = await params;
  const c = getCharacter(slug);
  if (!c?.directory) notFound();

  const art = getArt(c.id);
  const d = c.dossier;
  const name = displayName(c);
  const timeline = c.timeline ?? [];
  const showRelations = connectionCount(c.id) > 0;
  const showGallery = art.gallery.length >= 3;
  // Per-character accent and atmosphere drive the archive surfaces as well as the text.
  const theme = { "--accent": c.palette?.accent, "--sky": c.palette?.sky, "--ground": c.palette?.ground } as React.CSSProperties;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "biography", label: d ? "Biography" : "Summary" },
    ...(timeline.length ? [{ id: "moments", label: "Key moments" }] : []),
    ...(showRelations ? [{ id: "relationships", label: "Relationships" }] : []),
    ...(showGallery ? [{ id: "gallery", label: "Gallery" }] : []),
    { id: "legacy", label: "Legacy" },
  ];

  const sources = [...(d?.sources ?? c.sources ?? []), c.quote?.source, d?.closingQuote?.source].filter((s) => s !== undefined);

  return (
    <article style={theme}>
      <SectionNav sections={sections} />
      <ProfileHero character={c} art={art} />
      <Biography character={c} art={art} />

      {timeline.length > 0 && (
        <Band id="moments" title="Key moments" kicker={`${timeline[0].date} – ${timeline.at(-1)!.date}`}>
          <KeyMoments events={timeline} art={art} />
        </Band>
      )}

      {showRelations && (
        <Band
          id="relationships"
          title="Relationships"
          kicker={`People who shaped ${name.split(" ")[0]}`}
          action={
            <Link href={`/relationships?focus=${c.id}`} className="btn-outline">
              Explore the full map <ArrowRight className="size-4" />
            </Link>
          }
        >
          <ProfileMap focusId={c.id} art={getArtMap()} />
        </Band>
      )}

      {showGallery && (
        <Band id="gallery" title="Gallery" kicker={c.setting} pad="py-20">
          <Gallery plates={art.gallery} name={name} />
        </Band>
      )}

      <Legacy character={c} art={art} />

      <footer className="archive relative border-t border-line">
        <div className="relative z-10 mx-auto max-w-[1320px] px-4 py-8 sm:px-8">
          <p className="font-sans text-xs text-muted">
            <span className="label mr-3 text-[0.62rem]">Sources</span>
            {sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-bone">
                  {s.label}: {decodeURIComponent(s.url.split("/").pop() ?? "").replace(/_/g, " ")}
                </a>
              </span>
            ))}
          </p>
        </div>
      </footer>
      <SiteFooter />
    </article>
  );
}
