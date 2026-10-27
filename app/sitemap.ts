import type { MetadataRoute } from "next";
import { directoryCharacters } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  const at = (path: string, priority: number) => ({ url: new URL(path, base).toString(), priority });
  return [
    at("/", 1),
    at("/characters", 0.9),
    at("/relationships", 0.8),
    ...directoryCharacters.map((c) => at(`/characters/${c.id}`, 0.7)),
  ];
}
