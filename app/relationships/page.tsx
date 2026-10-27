import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Explorer } from "@/components/relationships/Explorer";
import { getArtMap } from "@/lib/art";

export const metadata: Metadata = {
  title: "Relationships",
  description: "Explore the families, mentors, allies, lovers and rivals that connect Assassin's Creed characters.",
};

export default function RelationshipsPage() {
  const art = getArtMap();
  return (
    // The selected character lives in ?focus=, which is only known at request time.
    <>
      <Suspense fallback={<div className="min-h-dvh" />}>
        <Explorer art={art} />
      </Suspense>
      <SiteFooter />
    </>
  );
}
