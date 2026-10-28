import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LoginDialogProvider } from "@/components/auth/LoginDialogProvider";
import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HostelLo",
  description: "Student-first hostel discovery, booking, and owner listings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={inter.variable} lang="en">
      <body className="min-h-screen bg-canvas text-ink">
        <LoginDialogProvider
          googleEnabled={Boolean(
            process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
          )}
        >
          {children}
        </LoginDialogProvider>
      </body>
    </html>
  );
}
