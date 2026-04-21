import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "variable",
  display: "swap",
  axes: ["opsz"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HostelLo — Find Student Hostels in Pakistan",
    template: "%s | HostelLo",
  },
  description:
    "Browse verified student hostels across Lahore, Islamabad, and Karachi. Filter by price, gender, and amenities. Book directly with no hidden fees.",
  keywords: ["student hostel", "hostel Pakistan", "hostel Lahore", "hostel Islamabad", "student accommodation"],
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "HostelLo",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${bricolageGrotesque.variable} ${figtree.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#fff",
                border: "1px solid #E8E8E8",
                color: "#0A0A0A",
                fontFamily: "var(--font-sans)",
                borderRadius: "12px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}