"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "#f3f4f6",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              maxWidth: "500px",
              textAlign: "center",
            }}
          >
            <h1 style={{ color: "#1f2937", marginBottom: "10px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              We've been notified and are working to fix the issue. Please try
              again.
            </p>
            {error.digest && (
              <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "20px" }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
