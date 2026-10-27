import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // 90 is used for the remaining next/image callers (cards, portraits); everything else uses 75.
  images: { qualities: [75, 90] },

  // Generated art carries a content hash in its filename (scripts/art/build.mjs), so a given
  // URL never changes and repeat visits can skip revalidating it.
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
