import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Keep lint available via `npm run lint`, but don't let unrelated
    // repo-wide lint debt block production builds on Vercel.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "*.cloudflare.com" },
    ],
  },
};

export default nextConfig;
