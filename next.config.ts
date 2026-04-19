import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "*.cloudflare.com" },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
