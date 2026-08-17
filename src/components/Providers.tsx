// Path: src/components/Providers.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a stable QueryClient instance per component lifecycle.
  // useState ensures the client is not re-created on every render.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 60 seconds stale time — avoids refetching on every mount
            staleTime: 60 * 1000,
            // Retry once on failure, not three times
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
