import { FeaturedHero } from "@/components/home/FeaturedHero";
import { getArtMap } from "@/lib/art";

/** The homepage is a single screen: the featured hero and nothing below it. */
export default function Home() {
  return <FeaturedHero art={getArtMap()} />;
}
