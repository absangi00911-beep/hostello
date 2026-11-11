import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LoginDialogProvider } from "@/components/auth/LoginDialogProvider";
import { getConfiguredSignInMethods } from "@/lib/auth/sign-in-methods";
import { buildRootMetadata } from "@/lib/site-metadata";
import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const signInMethods = getConfiguredSignInMethods();

  return (
    <html className={inter.variable} lang="en">
      <body className="min-h-dvh bg-canvas text-ink">
        <LoginDialogProvider
          emailCodeEnabled={signInMethods.emailCode}
          googleEnabled={signInMethods.google}
        >
          {children}
          <SiteFooter />
        </LoginDialogProvider>
      </body>
    </html>
  );
}
