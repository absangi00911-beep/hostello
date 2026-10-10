// Path: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { twMerge } from "tailwind-merge";

// The app keeps its sans faces for controls and body copy. Editorial display
// headlines use a system serif stack from globals.css to avoid another font fetch.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://hostello.pk"),
  title: {
    default: "HostelLo | Find Best Hostels in Pakistan",
    template: "%s | HostelLo",
  },
  description:
    "Find your desired hostel in Pakistan with HostelLo. Browse listings, compare prices, and book your seat online.",
};

export const viewport: Viewport = {
  themeColor: "#f6f2eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="relative"
    >
      <body className={twMerge(`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
