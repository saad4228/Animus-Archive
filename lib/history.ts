"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * A mirror of the browser's history stack for in-app pages, so a back button
 * knows whether the previous entry is part of the archive or the visitor landed
 * here directly.
 *
 * Entries are keyed by the Navigation API's per-entry key, so returning to an
 * entry truncates the stack above it regardless of the order popstate and
 * Next.js rendering happen in. Without that API we key by path.
 */
interface Entry {
  key: string;
  path: string;
}

let stack: Entry[] = [];
const listeners = new Set<() => void>();

type NavigationLike = { currentEntry?: { key: string } | null };

function currentKey(path: string) {
  const nav = (window as unknown as { navigation?: NavigationLike }).navigation;
  return nav?.currentEntry?.key ?? `path:${path}`;
}

export function useTrackNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    const key = currentKey(pathname);
    const at = stack.findIndex((e) => e.key === key);
    stack = at >= 0 ? stack.slice(0, at + 1) : [...stack, { key, path: pathname }];
    listeners.forEach((l) => l());
  }, [pathname]);
}

export function subscribeHistory(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The in-app page before `pathname`, or null if there isn't one. A page renders
 * before the tracker's effect runs, so until it has recorded `pathname`, judge
 * from the live history entry instead.
 */
export function previousPathFor(pathname: string) {
  const top = stack.at(-1);
  if (top?.path === pathname) return stack.at(-2)?.path ?? null;
  const key = currentKey(pathname);
  const at = stack.findIndex((e) => e.key === key);
  if (at >= 0) return stack[at - 1]?.path ?? null; // returning to an entry we already know
  return top?.path ?? null; // a new entry: the page we came from
}
