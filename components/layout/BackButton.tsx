"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { previousPathFor, subscribeHistory } from "@/lib/history";

const label = (path: string | null) => {
  if (!path) return null;
  if (path === "/") return "Home";
  if (path.startsWith("/relationships")) return "Relationships";
  if (path === "/characters") return "Characters";
  if (path.startsWith("/characters/")) return "Previous profile";
  return null;
};

/** Goes back within the archive, or to `fallback` when the page was opened directly. */
export function BackButton({ fallback, fallbackLabel, className = "" }: { fallback: string; fallbackLabel: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // Read after hydration only: the server can't know the visitor's history.
  const prev = useSyncExternalStore(
    subscribeHistory,
    () => previousPathFor(pathname),
    () => null,
  );
  const prevLabel = label(prev);
  const text = prevLabel ? `Back to ${prevLabel}` : `All ${fallbackLabel}`;

  return (
    <Link
      href={fallback}
      onClick={(e) => {
        if (!prevLabel) return;
        e.preventDefault();
        router.back();
      }}
      className={`group inline-flex items-center gap-3 border border-bone/25 bg-ink-950/55 px-4 py-2.5 font-display text-[0.68rem] uppercase tracking-[0.22em] text-bone backdrop-blur-sm transition-colors hover:border-crimson-bright ${className}`}
    >
      <ArrowLeft className="size-4 text-crimson-bright transition-transform group-hover:-translate-x-0.5" />
      {text}
    </Link>
  );
}
