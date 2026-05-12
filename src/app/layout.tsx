import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

/* ── Google Fonts ────────────────────────────────────────────
   Loaded via next/font/google for optimal performance:
   - Preloaded, no layout shift
   - Self-hosted via Next.js (no external request at runtime)
   - Exposed as CSS variables matching DESIGN.md
──────────────────────────────────────────────────────────── */
const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

/* ── Metadata ─────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "HostelLo — Find your room. Not a phone number.",
    template: "%s | HostelLo",
  },
  description:
    "A marketplace where Pakistani students find, compare, and book verified hostel accommodation near their university — without calling anyone.",
  keywords: [
    "hostel",
    "Pakistan",
    "student accommodation",
    "university hostel",
    "Lahore hostel",
    "Karachi hostel",
    "Islamabad hostel",
  ],
  authors: [{ name: "HostelLo" }],
  creator: "HostelLo",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://hostello.pk"
  ),
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "HostelLo",
    title: "HostelLo — Find your room. Not a phone number.",
    description:
      "Find, compare, and book verified student hostels near your university.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HostelLo",
    description: "Find, compare, and book verified student hostels in Pakistan.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* ── Root Layout ──────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`
        ${bricolageGrotesque.variable}
        ${dmSans.variable}
        ${jetbrainsMono.variable}
      `}
    >
      <body>
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-body)",
              fontFamily: "var(--font-body)",
              boxShadow: "var(--shadow-lg)",
              borderRadius: "var(--radius-lg)",
            },
          }}
        />
      </body>
    </html>
  );
}