import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LoginDialogProvider } from "@/components/auth/LoginDialogProvider";
import { getConfiguredSignInMethods } from "@/lib/auth/sign-in-methods";
import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HostelLo",
  description: "Student-first hostel discovery, booking, and owner listings.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const signInMethods = getConfiguredSignInMethods();

  return (
    <html className={inter.variable} lang="en">
      <body className="min-h-screen bg-canvas text-ink">
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
