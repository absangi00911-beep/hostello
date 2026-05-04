import type { NextConfig } from "next";

// Dev-only allowance so impeccable live mode can load. Guarded by NODE_ENV.
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";

// Environment-aware CSP configuration
// In development: Allow unsafe-eval and unsafe-inline (required for Next.js HMR)
// In production: Allow unsafe-inline for Next.js internal scripts (hydration, error boundaries)
const getScriptSrc = (): string => {
  const base = ["'self'", "'unsafe-inline'"];
  
  // Also allow unsafe-eval in development for HMR
  if (process.env.NODE_ENV === "development") {
    base.push("'unsafe-eval'");
  }
  
  return base.join(" ");
};

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${getScriptSrc()}${__impeccableLiveDev}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob: data: https://images.unsplash.com https://*.r2.dev https://*.cloudflare.com https://*.tile.openstreetmap.org",
      // API connections — includes Safepay, JazzCash, and EasyPaisa
      [
        "connect-src 'self'",
        "https://*.neon.tech",
        "https://*.upstash.io",
        "https://api.resend.com",
        "https://*.getsafepay.com",
        "https://sandbox.api.getsafepay.com",
        "https://sandbox.jazzcash.com.pk",
        "https://payments.jazzcash.com.pk",
        "https://easypaisasandbox.pk",
        "https://easypaisa.com.pk",
      ].join(" ") + `${__impeccableLiveDev}`,
      // Allow POSTing to payment gateway checkout pages from this origin
      [
        "form-action 'self'",
        "https://sandbox.jazzcash.com.pk",
        "https://payments.jazzcash.com.pk",
        "https://easypaisasandbox.pk",
        "https://easypaisa.com.pk",
        "https://sandbox.getsafepay.com",
        "https://getsafepay.com",
      ].join(" "),
      // Allow OpenStreetMap embeds for the hostel location map
      "frame-src https://www.openstreetmap.org",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "*.cloudflare.com" },
      // OAuth providers for user avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.gravatar.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;