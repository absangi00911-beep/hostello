"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { siteCopy } from "@/lib/site-copy";

/**
 * Last-resort boundary for errors thrown by the root layout itself, which
 * error.tsx cannot catch. It replaces the whole document, so it must render
 * <html> and <body> and cannot rely on globals.css or the root layout's fonts.
 * Styles are inline for that reason.
 *
 * The error is reported to Sentry (scrubbed by the client init) and never
 * shown to the user.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const { states } = siteCopy;

  return (
    <html lang="en">
      <head>
        {/* The root layout's viewport and metadata are not applied here. */}
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{states.errorTitle}</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
          color: "#111827",
        }}
      >
        <div role="alert" style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 700 }}>
            {states.errorTitle}
          </h1>
          <p style={{ margin: "0 0 20px", lineHeight: 1.6, color: "#4b5563" }}>
            {states.errorBody}
          </p>
          <button
            onClick={() => retry()}
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#ffffff",
              background: "#111827",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
            type="button"
          >
            {states.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
