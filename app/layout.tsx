import type { Metadata } from "next";
import { Suspense } from "react";
import { Cinzel, EB_Garamond, Inter } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EmblemDefs } from "@/components/ui/Emblem";
import { getArtMap } from "@/lib/art";
import { getTracks } from "@/lib/audio";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400", "500", "600"] });
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "The Animus Archive", template: "%s · The Animus Archive" },
  description: "An unofficial archive of Assassin's Creed characters: their lives, families, rivals and legacies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const art = getArtMap();
  return (
    <html lang="en" className={`${cinzel.variable} ${garamond.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-crimson px-4 py-2 font-sans text-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {/* usePathname suspends on request-time routes (unknown profile slugs). */}
        <Suspense fallback={<div className="fixed inset-x-0 top-0 z-40 h-[var(--header-h)] bg-ink-950/85" />}>
          <SiteHeader art={art} tracks={getTracks()} />
        </Suspense>
        <EmblemDefs />
        {/* No shared footer: the homepage is a single fixed screen; other pages render SiteFooter themselves. */}
        <main id="main" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
