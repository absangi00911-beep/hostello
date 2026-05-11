import { validateEnvironmentOnce } from "@/lib/env-validation";

// Validate env vars as soon as the server starts
validateEnvironmentOnce();

export const metadata = {
  title: "Hostello",
  description: "Hostello - Hostel Booking Platform",
};

import React from "react";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <Navbar />
          {children}
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
