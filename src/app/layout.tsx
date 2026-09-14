import type { Metadata, Viewport } from "next";
import { DM_Sans, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { twMerge } from "tailwind-merge";

// Design system swap (WanderStay spec): Plus Jakarta Sans for headings,
// Be Vietnam Pro for body/labels — referenced in globals.css as
// --font-heading / --font-body. next/font self-hosts the files at build
// time: no external request from the browser, no layout shift.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "700"],
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
  themeColor: "#f8f9fa",
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
      className= "relative"
    >
      <body className={twMerge(`${dmSans.variable} ${beVietnamPro.variable} ${jetbrainsMono.variable} "antialiased bg-[#EAEEFE]"` )}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
