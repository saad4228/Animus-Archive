import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Emblem } from "@/components/ui/Emblem";

export default function NotFound() {
  return (
    <>
    <section className="flex min-h-[80dvh] flex-col items-center justify-center px-4 pt-[var(--header-h)] text-center">
      <Emblem kind="seal" className="size-16 text-bone-dim" />
      <p className="eyebrow mt-8">Memory corrupted</p>
      <h1 className="display mt-4 text-[clamp(2rem,4vw,3.2rem)] tracking-[0.12em]">
        Not in the <span className="text-crimson-bright">archive</span>
      </h1>
      <p className="mt-5 max-w-md text-lg text-bone-dim">This page or character doesn&apos;t exist here — yet.</p>
      <Link href="/characters" className="btn-outline mt-9">
        <ArrowLeft className="size-4" /> Back to the characters
      </Link>
    </section>
    <SiteFooter />
    </>
  );
}
