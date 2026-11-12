import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// The project's own public image bucket, taken from R2_PUBLIC_URL. When it is
// set, only that exact host may serve images. A wildcard on r2.dev would also
// allow every other Cloudflare user's public bucket, and would block a custom
// domain. The wildcard is kept only for local development and Vercel Preview;
// a real production deployment (VERCEL_ENV=production) refuses to build without
// a valid https R2_PUBLIC_URL, matching the runtime check in env-validation.ts.
function getR2ImageSource(): { host: string; hostname: string; port: string } | null {
  try {
    const url = new URL(process.env.R2_PUBLIC_URL ?? "");
    if (url.protocol !== "https:") return null;
    return { host: url.host, hostname: url.hostname, port: url.port };
  } catch {
    return null;
  }
}

const r2Image = getR2ImageSource();
if (!r2Image && process.env.VERCEL_ENV === "production") {
  throw new Error(
    "R2_PUBLIC_URL must be set to the https URL of the public image bucket for production builds. " +
      "Without it the image allowlist would fall back to every r2.dev bucket.",
  );
}
const r2CspSource = r2Image ? `https://${r2Image.host}` : "https://*.r2.dev";

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
    value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${getScriptSrc()}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' blob: data: https://images.unsplash.com ${r2CspSource} https://*.cloudflare.com https://*.tile.openstreetmap.org`,
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
        "https://*.sentry.io",
      ].join(" "),
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
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      r2Image
        ? { protocol: "https", hostname: r2Image.hostname, ...(r2Image.port ? { port: r2Image.port } : {}) }
        : { protocol: "https", hostname: "pub-*.r2.dev" },
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
      {
        // Reset links carry a bearer token in the URL; never send that URL as a referrer.
        source: "/reset-password",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
